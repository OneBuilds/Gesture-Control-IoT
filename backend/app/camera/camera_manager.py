import cv2
import time
import threading
from typing import List, Dict, Any, Optional, Tuple

class CameraManager:
    def __init__(self, device_id: int = 0, target_width: int = 1280, target_height: int = 720):
        self.device_id = device_id
        self.target_width = target_width
        self.target_height = target_height

        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.status = "disconnected"  # "disconnected" | "initializing" | "streaming" | "error"
        self.device_name = None
        
        self.actual_width: Optional[int] = None
        self.actual_height: Optional[int] = None
        self.measured_fps: Optional[float] = None
        
        self.consecutive_failures = 0
        self._frame_times: List[float] = []
        self._lock = threading.Lock()
        self.current_frame = None

    def enumerate_cameras(self, max_devices: int = 2) -> List[Dict[str, Any]]:
        """Scans for accessible video capture devices safely without interrupting active stream."""
        available = []
        with self._lock:
            is_active = self.is_running and self.status == "streaming"
            active_id = self.device_id

        if is_active:
            w = self.actual_width or 640
            h = self.actual_height or 480
            available.append({
                "id": active_id,
                "name": self.device_name or "Integrated Webcam",
                "resolution": f"{w} × {h}"
            })

        for i in range(max_devices):
            if is_active and i == active_id:
                continue
            try:
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    ret, _ = cap.read()
                    if ret:
                        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        available.append({
                            "id": i,
                            "name": f"Camera {i}" if i != 0 else "Integrated Webcam",
                            "resolution": f"{w} × {h}"
                        })
                    cap.release()
            except Exception:
                pass

        if not available:
            available.append({"id": 0, "name": "Integrated Webcam", "resolution": "640 × 480"})

        return available

    def start(self, device_id: Optional[int] = None) -> bool:
        with self._lock:
            if device_id is not None:
                self.device_id = device_id
            
            self.stop_unlocked()
            self.status = "initializing"
            self.consecutive_failures = 0
            
            try:
                self.cap = cv2.VideoCapture(self.device_id)
                if not self.cap.isOpened():
                    self.status = "error"
                    self.device_name = None
                    self.actual_width = None
                    self.actual_height = None
                    self.measured_fps = None
                    return False
                
                # Set requested resolution
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.target_width)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.target_height)
                
                # Verify actual resolution from camera hardware
                self.actual_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                self.actual_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                self.device_name = "Integrated Webcam" if self.device_id == 0 else f"Camera {self.device_id}"
                
                self.is_running = True
                self.status = "streaming"
                self._frame_times.clear()
                return True
            except Exception as e:
                print(f"[CameraManager] Error starting camera {self.device_id}: {e}")
                self.status = "error"
                self.actual_width = None
                self.actual_height = None
                self.measured_fps = None
                return False

    def read_frame(self) -> Tuple[bool, Optional[Any]]:
        with self._lock:
            if not self.is_running or self.cap is None or not self.cap.isOpened():
                self.status = "disconnected"
                return False, None

            ret, frame = self.cap.read()
            if not ret or frame is None:
                self.consecutive_failures += 1
                if self.consecutive_failures > 5:
                    self.status = "error"
                return False, None

            self.consecutive_failures = 0
            self.status = "streaming"
            now = time.time()
            self._frame_times.append(now)
            # Retain frame timestamps from last 1 second for rolling FPS calculation
            self._frame_times = [t for t in self._frame_times if now - t <= 1.0]
            if len(self._frame_times) > 1:
                elapsed = now - self._frame_times[0]
                if elapsed > 0:
                    self.measured_fps = round((len(self._frame_times) - 1) / elapsed, 1)
            
            self.current_frame = frame
            return True, frame

    def get_telemetry(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "status": self.status,
                "deviceName": self.device_name if self.status == "streaming" else None,
                "width": self.actual_width if self.status == "streaming" else None,
                "height": self.actual_height if self.status == "streaming" else None,
                "fps": self.measured_fps if self.status == "streaming" else None,
                "deviceId": self.device_id
            }

    def stop_unlocked(self):
        self.is_running = False
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
        self.status = "disconnected"
        self.current_frame = None

    def stop(self):
        with self._lock:
            self.stop_unlocked()
