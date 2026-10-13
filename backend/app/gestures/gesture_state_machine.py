import time
from typing import Dict, Any, Optional, Tuple
from app.actions.action_dispatcher import ActionDispatcher, ActionResult

class GestureStateMachine:
    def __init__(self):
        self.current_state = "IDLE"  # IDLE | CANDIDATE | CONFIRMED | ACTION | COOLDOWN
        self.active_gesture: Optional[str] = None
        self.candidate_gesture: Optional[str] = None
        self.candidate_start_time: float = 0.0
        self.last_action_time: float = 0.0
        
        # Tracking previous positions for scroll and drag motion calculation
        self.prev_two_fingers_y: Optional[float] = None
        self.prev_pinch_pos: Optional[Tuple[float, float]] = None
        self.is_dragging = False

    def update(self, detected_gesture: Optional[str], confidence: float, details: Dict[str, Any],
               config: Dict[str, Any], action_dispatcher: ActionDispatcher, paused: bool) -> Dict[str, Any]:
        """
        Processes frame gesture detection through the state machine and dispatches OS actions.
        Returns active gesture state dictionary for WebSocket telemetry and UI display.
        """
        now = time.time()
        safety_cfg = config.get("safety", {})
        toggles = config.get("gestures", {})
        cursor_cfg = config.get("cursor", {})

        min_conf = safety_cfg.get("min_confidence", 0.45)
        hold_duration = safety_cfg.get("hold_duration", 1.0)
        cooldown_duration = safety_cfg.get("cooldown_duration", 0.5)

        # Check confidence threshold
        if confidence < min_conf:
            detected_gesture = None

        # Emergency stop mouse drag if paused or hand lost
        if paused or not detected_gesture:
            if self.is_dragging:
                action_dispatcher.dispatch_drag_end(paused=paused)
                self.is_dragging = False

        # Process Cursor Move (INDEX_POINT or un-pinched pointer)
        if detected_gesture == "INDEX_POINT" and toggles.get("cursor", True):
            if "index_tip" in details:
                tip = details["index_tip"]
                action_dispatcher.dispatch_move_cursor(
                    tip["x"], tip["y"],
                    sensitivity=cursor_cfg.get("sensitivity", 1.2),
                    smoothing=cursor_cfg.get("smoothing", 0.65),
                    x_min=cursor_cfg.get("x_min", 0.1),
                    x_max=cursor_cfg.get("x_max", 0.9),
                    y_min=cursor_cfg.get("y_min", 0.1),
                    y_max=cursor_cfg.get("y_max", 0.9),
                    paused=paused
                )

        # Drag state check: if we were dragging but pinch is released, stop drag
        if self.is_dragging and detected_gesture != "PINCH":
            action_dispatcher.dispatch_drag_end(paused=paused)
            self.is_dragging = False

        # Reset two finger position if gesture changes
        if detected_gesture != "TWO_FINGERS":
            self.prev_two_fingers_y = None

        # If no gesture or feature disabled, reset candidate state
        if not detected_gesture or not toggles.get(self._get_toggle_key(detected_gesture), True):
            if self.current_state not in ["COOLDOWN"]:
                self.current_state = "IDLE"
                self.candidate_gesture = None
            if now - self.last_action_time >= cooldown_duration:
                self.current_state = "IDLE"
            return {
                "name": detected_gesture,
                "confidence": confidence if detected_gesture else None,
                "action": None,
                "state": self.current_state
            }

        # Handle continuous/immediate movement gestures
        if detected_gesture == "PINCH":
            center = details.get("pinch_center", {})
            curr_pos = (center.get("x", 0.5), center.get("y", 0.5))
            
            # Also move cursor along with pinch center if cursor is enabled
            if toggles.get("cursor", True) and "x" in center:
                action_dispatcher.dispatch_move_cursor(
                    center["x"], center["y"],
                    sensitivity=cursor_cfg.get("sensitivity", 1.2),
                    smoothing=cursor_cfg.get("smoothing", 0.65),
                    x_min=cursor_cfg.get("x_min", 0.1),
                    x_max=cursor_cfg.get("x_max", 0.9),
                    y_min=cursor_cfg.get("y_min", 0.1),
                    y_max=cursor_cfg.get("y_max", 0.9),
                    paused=paused
                )

            # Check for Pinch + Move (Drag & Drop)
            if self.is_dragging:
                return {
                    "name": "PINCH_DRAG",
                    "confidence": confidence,
                    "action": "DRAG_DROP",
                    "state": "ACTION"
                }

            if self.prev_pinch_pos and toggles.get("drag", True):
                dist_moved = ((curr_pos[0] - self.prev_pinch_pos[0])**2 + (curr_pos[1] - self.prev_pinch_pos[1])**2)**0.5
                if dist_moved > 0.03: # Drag movement threshold passed
                    res, log_e = action_dispatcher.dispatch_drag_start(paused=paused)
                    if res == ActionResult.SUCCESS:
                        self.is_dragging = True
                        self.prev_pinch_pos = curr_pos
                        return {
                            "name": "PINCH_DRAG",
                            "confidence": confidence,
                            "action": "DRAG_DROP",
                            "state": "ACTION"
                        }
            self.prev_pinch_pos = curr_pos

            # Single Left Click trigger if not dragging and cooldown satisfied
            if not self.is_dragging and toggles.get("click", True):
                if now - self.last_action_time >= cooldown_duration:
                    res, log_e = action_dispatcher.dispatch_click(paused=paused)
                    if res == ActionResult.SUCCESS:
                        self.last_action_time = now
                        self.current_state = "COOLDOWN"
                        return {
                            "name": "PINCH",
                            "confidence": confidence,
                            "action": "LEFT_CLICK",
                            "state": "ACTION"
                        }

        elif detected_gesture == "TWO_FINGERS" and toggles.get("scroll", True):
            curr_y = details.get("index_y", 0.5)
            if self.prev_two_fingers_y is not None:
                dy = curr_y - self.prev_two_fingers_y
                if abs(dy) > 0.015 and (now - self.last_action_time >= 0.1): # Rate limited scroll
                    direction = "DOWN" if dy > 0 else "UP"
                    magnitude = min(3.0, abs(dy) * 20.0)
                    action_dispatcher.dispatch_scroll(direction=direction, magnitude=magnitude, paused=paused)
                    self.last_action_time = now
            self.prev_two_fingers_y = curr_y
            return {
                "name": "TWO_FINGERS",
                "confidence": confidence,
                "action": "SCROLL",
                "state": "ACTION"
            }

        elif detected_gesture in ["THUMB_UP", "THUMB_DOWN"] and toggles.get("volume", True):
            if now - self.last_action_time >= cooldown_duration:
                direction = "UP" if detected_gesture == "THUMB_UP" else "DOWN"
                res, log_e = action_dispatcher.dispatch_volume(direction=direction, paused=paused)
                if res == ActionResult.SUCCESS:
                    self.last_action_time = now
                    self.current_state = "COOLDOWN"
                    return {
                        "name": detected_gesture,
                        "confidence": confidence,
                        "action": f"VOLUME_{direction}",
                        "state": "ACTION"
                    }

        elif detected_gesture == "OPEN_PALM" and toggles.get("home", True):
            if self.candidate_gesture != "OPEN_PALM":
                self.candidate_gesture = "OPEN_PALM"
                self.candidate_start_time = now
                self.current_state = "CANDIDATE"
            else:
                elapsed = now - self.candidate_start_time
                if elapsed >= hold_duration:
                    if now - self.last_action_time >= cooldown_duration + hold_duration:
                        res, log_e = action_dispatcher.dispatch_home(paused=paused)
                        if res == ActionResult.SUCCESS:
                            self.last_action_time = now
                            self.current_state = "COOLDOWN"
                            self.candidate_gesture = None
                            return {
                                "name": "OPEN_PALM",
                                "confidence": confidence,
                                "action": "HOME_RESET",
                                "state": "ACTION"
                            }
                else:
                    return {
                        "name": "OPEN_PALM",
                        "confidence": confidence,
                        "action": "HOLD_FOR_HOME",
                        "state": "CANDIDATE"
                    }

        return {
            "name": detected_gesture,
            "confidence": confidence,
            "action": self._map_action_label(detected_gesture),
            "state": self.current_state
        }

    def _get_toggle_key(self, gesture_name: str) -> str:
        mapping = {
            "INDEX_POINT": "cursor",
            "PINCH": "click",
            "PINCH_DRAG": "drag",
            "TWO_FINGERS": "scroll",
            "THUMB_UP": "volume",
            "THUMB_DOWN": "volume",
            "OPEN_PALM": "home"
        }
        return mapping.get(gesture_name, "cursor")

    def _map_action_label(self, gesture_name: Optional[str]) -> Optional[str]:
        mapping = {
            "INDEX_POINT": "MOVE_CURSOR",
            "PINCH": "LEFT_CLICK",
            "PINCH_DRAG": "DRAG_DROP",
            "TWO_FINGERS": "SCROLL",
            "THUMB_UP": "VOLUME_UP",
            "THUMB_DOWN": "VOLUME_DOWN",
            "OPEN_PALM": "HOME_RESET"
        }
        return mapping.get(gesture_name) if gesture_name else None
