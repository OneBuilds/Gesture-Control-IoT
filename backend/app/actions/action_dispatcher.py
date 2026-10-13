import sys
import time
import logging
from typing import Dict, Any, Optional, Tuple
from app.actions.action_controller import ActionController

logger = logging.getLogger("AirControl.ActionDispatcher")
logger.setLevel(logging.INFO)

class ActionResult:
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    IGNORED = "IGNORED"

class ActionDispatcher:
    def __init__(self, action_controller: ActionController, activity_logger=None):
        self.controller = action_controller
        self.activity_logger = activity_logger

    def dispatch_move_cursor(self, norm_x: float, norm_y: float, sensitivity: float, smoothing: float,
                             x_min: float, x_max: float, y_min: float, y_max: float, paused: bool) -> str:
        if paused:
            return ActionResult.IGNORED
        try:
            self.controller.move_cursor(
                norm_x, norm_y, sensitivity, smoothing, x_min, x_max, y_min, y_max, paused=False
            )
            return ActionResult.SUCCESS
        except Exception as e:
            logger.error(f"[ActionDispatcher] MOVE_CURSOR failed: {e}")
            return ActionResult.FAILED

    def dispatch_click(self, paused: bool, gesture_name: str = "PINCH") -> Tuple[str, Optional[Dict[str, Any]]]:
        if paused:
            return ActionResult.IGNORED, None
        try:
            success = self.controller.click(paused=False)
            if success:
                log_entry = None
                if self.activity_logger:
                    log_entry = self.activity_logger.log(gesture_name, "Left Click", details="SUCCESS")
                logger.info(f"[ActionDispatcher] {gesture_name} -> LEFT_CLICK SUCCESS")
                return ActionResult.SUCCESS, log_entry
            return ActionResult.FAILED, None
        except Exception as e:
            logger.error(f"[ActionDispatcher] LEFT_CLICK failed: {e}")
            return ActionResult.FAILED, None

    def dispatch_drag_start(self, paused: bool, gesture_name: str = "PINCH_DRAG") -> Tuple[str, Optional[Dict[str, Any]]]:
        if paused:
            return ActionResult.IGNORED, None
        try:
            success = self.controller.start_drag(paused=False)
            if success:
                log_entry = None
                if self.activity_logger:
                    log_entry = self.activity_logger.log(gesture_name, "Start Drag & Drop", details="SUCCESS")
                logger.info(f"[ActionDispatcher] {gesture_name} -> DRAG_START SUCCESS")
                return ActionResult.SUCCESS, log_entry
            return ActionResult.FAILED, None
        except Exception as e:
            logger.error(f"[ActionDispatcher] DRAG_START failed: {e}")
            return ActionResult.FAILED, None

    def dispatch_drag_end(self, paused: bool, gesture_name: str = "PINCH_DRAG") -> Tuple[str, Optional[Dict[str, Any]]]:
        try:
            success = self.controller.end_drag(paused=paused)
            if success and not paused:
                log_entry = None
                if self.activity_logger:
                    log_entry = self.activity_logger.log(gesture_name, "Release Drag & Drop", details="SUCCESS")
                logger.info(f"[ActionDispatcher] {gesture_name} -> DRAG_END SUCCESS")
                return ActionResult.SUCCESS, log_entry
            return ActionResult.SUCCESS if success else ActionResult.IGNORED, None
        except Exception as e:
            logger.error(f"[ActionDispatcher] DRAG_END failed: {e}")
            return ActionResult.FAILED, None

    def dispatch_scroll(self, direction: str, magnitude: float = 1.0, paused: bool = False, gesture_name: str = "TWO_FINGERS") -> Tuple[str, Optional[Dict[str, Any]]]:
        if paused:
            return ActionResult.IGNORED, None
        try:
            success = self.controller.scroll(direction=direction, magnitude=magnitude, paused=False)
            if success:
                log_entry = None
                if self.activity_logger:
                    log_entry = self.activity_logger.log(gesture_name, f"Scroll {direction.capitalize()}", details="SUCCESS")
                logger.info(f"[ActionDispatcher] {gesture_name} -> SCROLL {direction} SUCCESS")
                return ActionResult.SUCCESS, log_entry
            return ActionResult.FAILED, None
        except Exception as e:
            logger.error(f"[ActionDispatcher] SCROLL failed: {e}")
            return ActionResult.FAILED, None

    def dispatch_volume(self, direction: str, paused: bool = False, gesture_name: str = "THUMB_UP") -> Tuple[str, Optional[Dict[str, Any]]]:
        if paused:
            return ActionResult.IGNORED, None
        try:
            success = self.controller.adjust_volume(direction=direction, paused=False)
            if success:
                log_entry = None
                if self.activity_logger:
                    log_entry = self.activity_logger.log(gesture_name, f"Volume {direction.capitalize()}", details="SUCCESS")
                logger.info(f"[ActionDispatcher] {gesture_name} -> VOLUME {direction} SUCCESS")
                return ActionResult.SUCCESS, log_entry
            return ActionResult.FAILED, None
        except Exception as e:
            logger.error(f"[ActionDispatcher] VOLUME failed: {e}")
            return ActionResult.FAILED, None

    def dispatch_home(self, paused: bool, gesture_name: str = "OPEN_PALM") -> Tuple[str, Optional[Dict[str, Any]]]:
        try:
            success = self.controller.home_reset(paused=paused)
            log_entry = None
            if success and not paused:
                if self.activity_logger:
                    log_entry = self.activity_logger.log(gesture_name, "Home / Reset UI", details="SUCCESS")
                logger.info(f"[ActionDispatcher] {gesture_name} -> HOME_RESET SUCCESS")
            return ActionResult.SUCCESS if success else ActionResult.FAILED, log_entry
        except Exception as e:
            logger.error(f"[ActionDispatcher] HOME_RESET failed: {e}")
            return ActionResult.FAILED, None

    def emergency_stop(self):
        """Forces release of mouse button during pause, loss of hand, or shutdown."""
        try:
            self.controller.end_drag(paused=False)
        except Exception as e:
            logger.error(f"[ActionDispatcher] emergency_stop error: {e}")
