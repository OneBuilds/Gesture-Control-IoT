import cv2
import time
import asyncio
import json
import threading
from typing import List, Set, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config.config_manager import ConfigManager
from app.activity.activity_logger import ActivityLogger
from app.system.win_system import WinSystem
from app.camera.camera_manager import CameraManager
from app.tracking.hand_tracker import HandTracker
from app.gestures.gesture_detector import GestureDetector
from app.gestures.gesture_state_machine import GestureStateMachine
from app.actions.action_controller import ActionController
from app.actions.action_dispatcher import ActionDispatcher

app = FastAPI(title="AirControl Backend Service", version="1.0.0")

# Enable CORS for local web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core subsystems
config_mgr = ConfigManager()
activity_logger = ActivityLogger()
action_ctrl = ActionController(activity_logger=activity_logger)
action_dispatcher = ActionDispatcher(action_controller=action_ctrl, activity_logger=activity_logger)
camera_mgr = CameraManager()
hand_tracker = HandTracker()
gesture_sm = GestureStateMachine()

is_paused = False
ws_clients: Set[WebSocket] = set()
ws_loop: Optional[asyncio.AbstractEventLoop] = None
latest_telemetry: Dict[str, Any] = {}
telemetry_lock = threading.Lock()
frame_bytes_lock = threading.Lock()
latest_mjpeg_bytes: Optional[bytes] = None

# Processing Thread Control
processing_thread: Optional[threading.Thread] = None
stop_event = threading.Event()

def build_gestures_status(cfg: Dict[str, Any]) -> List[Dict[str, Any]]:
    toggles = cfg.get("gestures", {})
    return [
        {"id": "cursor", "name": "Index Finger", "action": "Move Cursor", "enabled": toggles.get("cursor", True)},
        {"id": "click", "name": "Pinch", "action": "Left Click", "enabled": toggles.get("click", True)},
        {"id": "drag", "name": "Pinch + Move", "action": "Drag & Drop", "enabled": toggles.get("drag", True)},
        {"id": "scroll", "name": "Two Fingers", "action": "Scroll", "enabled": toggles.get("scroll", True)},
        {"id": "volume", "name": "Thumb Up / Down", "action": "Volume Control", "enabled": toggles.get("volume", True)},
        {"id": "home", "name": "Open Palm", "action": "Home / Reset UI", "enabled": toggles.get("home", True)},
    ]

def video_processing_loop():
    global latest_telemetry, latest_mjpeg_bytes, is_paused
    
    # Start camera with configured device ID
    cfg = config_mgr.get_all()
    device_id = cfg.get("camera", {}).get("device_id", 0)
    camera_mgr.start(device_id=device_id)

    while not stop_event.is_set():
        current_cfg = config_mgr.get_all()
        ret, frame = camera_mgr.read_frame()

        if not ret or frame is None:
            # Camera unavailable state
            hand_telemetry = {
                "detected": False,
                "landmarks": [],
                "handedness": None,
                "confidence": None,
                "timestamp": time.time()
            }
            gesture_status = {
                "name": None,
                "confidence": None,
                "action": None,
                "state": "IDLE"
            }
            annotated_frame = None
            time.sleep(0.05)
        else:
            # Process hand tracking & landmarks
            hand_telemetry, annotated_frame = hand_tracker.process(frame)

            # Process gesture detection & state transitions
            detected_g, conf, details = GestureDetector.detect_gesture(
                hand_telemetry["landmarks"],
                hand_telemetry["confidence"] or 0.0
            )

            gesture_status = gesture_sm.update(
                detected_gesture=detected_g,
                confidence=conf,
                details=details,
                config=current_cfg,
                action_dispatcher=action_dispatcher,
                paused=is_paused
            )

        # Encode frame to MJPEG bytes for web live preview
        if annotated_frame is not None:
            ret_jpg, jpeg_buf = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if ret_jpg:
                with frame_bytes_lock:
                    latest_mjpeg_bytes = jpeg_buf.tobytes()

        # Build telemetry state payload
        cam_telemetry = camera_mgr.get_telemetry()
        
        telemetry_payload = {
            "type": "telemetry",
            "system": {
                "active": True,
                "paused": is_paused,
            },
            "camera": cam_telemetry,
            "hand": {
                "detected": hand_telemetry["detected"],
                "confidence": hand_telemetry["confidence"],
                "handedness": hand_telemetry["handedness"]
            },
            "gesture": gesture_status,
            "gestures": build_gestures_status(current_cfg),
            "activity": activity_logger.get_entries(),
            "timestamp": time.time()
        }

        with telemetry_lock:
            latest_telemetry = telemetry_payload

        # Broadcast via WebSockets if clients are connected
        if ws_clients and ws_loop and ws_loop.is_running():
            msg = json.dumps(telemetry_payload)
            asyncio.run_coroutine_threadsafe(broadcast_ws_message(msg), ws_loop)

        # Control loop frequency ~30 FPS
        time.sleep(0.01)

    camera_mgr.stop()
    hand_tracker.close()

async def broadcast_ws_message(message: str):
    disconnected = set()
    for client in list(ws_clients):
        try:
            await client.send_text(message)
        except Exception:
            disconnected.add(client)
    for d in disconnected:
        ws_clients.discard(d)

@app.on_event("startup")
async def startup_event():
    global ws_loop, processing_thread
    ws_loop = asyncio.get_running_loop()
    stop_event.clear()
    processing_thread = threading.Thread(target=video_processing_loop, daemon=True)
    processing_thread.start()
    print("[AirControl Backend] Server started and video processing loop launched.")

@app.on_event("shutdown")
async def shutdown_event():
    stop_event.set()
    if processing_thread:
        processing_thread.join(timeout=2.0)
    print("[AirControl Backend] Shutdown complete.")

# REST Endpoints
@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "paused": is_paused,
        "camera_status": camera_mgr.status,
        "clients_connected": len(ws_clients)
    }

@app.get("/api/config")
def get_config():
    return config_mgr.get_all()

@app.post("/api/config")
def update_config(new_config: Dict[str, Any] = Body(...)):
    updated = config_mgr.update(new_config)
    # Check if startup registry setting was modified
    if "application" in new_config and "start_with_windows" in new_config["application"]:
        WinSystem.set_start_with_windows(new_config["application"]["start_with_windows"])
    return updated

@app.get("/api/cameras")
def get_cameras():
    return camera_mgr.enumerate_cameras()

@app.post("/api/camera/select")
def select_camera(payload: Dict[str, int] = Body(...)):
    device_id = payload.get("device_id", 0)
    cfg = config_mgr.get_all()
    cfg["camera"]["device_id"] = device_id
    config_mgr.save()
    success = camera_mgr.start(device_id=device_id)
    return {"success": success, "camera": camera_mgr.get_telemetry()}

@app.post("/api/pause")
def toggle_pause(payload: Dict[str, bool] = Body(...)):
    global is_paused
    if "paused" in payload:
        is_paused = payload["paused"]
    else:
        is_paused = not is_paused
    return {"paused": is_paused}

@app.post("/api/calibrate")
def update_calibration(payload: Dict[str, float] = Body(...)):
    cfg = config_mgr.get_all()
    cursor_cfg = cfg.get("cursor", {})
    for k in ["x_min", "x_max", "y_min", "y_max"]:
        if k in payload:
            cursor_cfg[k] = payload[k]
    cfg["cursor"] = cursor_cfg
    config_mgr.save()
    return {"success": True, "cursor": cursor_cfg}

@app.get("/api/activity")
def get_activity():
    return activity_logger.get_entries()

@app.delete("/api/activity")
def clear_activity():
    activity_logger.clear()
    return {"success": True}

# Live Camera Feed Stream Endpoint (MJPEG)
def generate_mjpeg_stream():
    while not stop_event.is_set():
        with frame_bytes_lock:
            frame_data = latest_mjpeg_bytes
        if frame_data:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
        time.sleep(0.03)

@app.get("/api/camera/stream")
def video_stream():
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# WebSocket Real-Time Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_clients.add(websocket)
    print(f"[WebSocket] Client connected ({len(ws_clients)} total)")
    
    # Send immediate initial telemetry snapshot
    with telemetry_lock:
        if latest_telemetry:
            await websocket.send_text(json.dumps(latest_telemetry))

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                msg_type = msg.get("type")
                if msg_type == "pause":
                    global is_paused
                    is_paused = msg.get("value", not is_paused)
                elif msg_type == "select_camera":
                    dev_id = msg.get("id", 0)
                    select_camera({"device_id": dev_id})
                elif msg_type == "clear_activity":
                    activity_logger.clear()
            except Exception as parse_err:
                print(f"[WebSocket] Message parse error: {parse_err}")
    except WebSocketDisconnect:
        ws_clients.discard(websocket)
        print(f"[WebSocket] Client disconnected ({len(ws_clients)} total)")
    except Exception as e:
        ws_clients.discard(websocket)
        print(f"[WebSocket] Unexpected client exit: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
