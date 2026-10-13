import ctypes
import pyautogui
from typing import Tuple
from app.system.win_system import WinSystem

# Disable PyAutoGUI pause for ultra responsive cursor movement
pyautogui.PAUSE = 0
pyautogui.FAILSAFE = False

class CursorController:
    def __init__(self):
        self.screen_width, self.screen_height = WinSystem.get_screen_size()
        self.prev_x = self.screen_width / 2
        self.prev_y = self.screen_height / 2
        self.initialized = False

    def update_screen_size(self):
        self.screen_width, self.screen_height = WinSystem.get_screen_size()

    def map_and_move(self, norm_x: float, norm_y: float, sensitivity: float = 1.2, smoothing: float = 0.65,
                     x_min: float = 0.1, x_max: float = 0.9, y_min: float = 0.1, y_max: float = 0.9) -> Tuple[int, int]:
        """
        Maps normalized camera coordinates (0.0 to 1.0) to screen coordinates with horizontal mirroring, exponential smoothing, and sensitivity.
        """
        # Mirror horizontal coordinate for natural webcam control (moving right moves cursor right)
        norm_x = max(0.0, min(1.0, 1.0 - norm_x))

        # Clamp normalized inputs to calibration bounds
        clamped_x = max(x_min, min(x_max, norm_x))
        clamped_y = max(y_min, min(y_max, norm_y))

        # Re-scale to [0, 1] relative to active workspace area
        range_x = max(0.01, x_max - x_min)
        range_y = max(0.01, y_max - y_min)
        rel_x = (clamped_x - x_min) / range_x
        rel_y = (clamped_y - y_min) / range_y

        # Apply sensitivity centered around midpoint 0.5
        rel_x = 0.5 + (rel_x - 0.5) * sensitivity
        rel_y = 0.5 + (rel_y - 0.5) * sensitivity

        rel_x = max(0.0, min(1.0, rel_x))
        rel_y = max(0.0, min(1.0, rel_y))

        # Target screen pixel position
        target_x = rel_x * self.screen_width
        target_y = rel_y * self.screen_height

        if not self.initialized:
            self.prev_x = target_x
            self.prev_y = target_y
            self.initialized = True

        # Exponential moving average filter for smooth cursor movement
        alpha = max(0.05, min(1.0, 1.0 - (smoothing * 0.85)))
        curr_x = self.prev_x + alpha * (target_x - self.prev_x)
        curr_y = self.prev_y + alpha * (target_y - self.prev_y)

        self.prev_x = curr_x
        self.prev_y = curr_y

        ix, iy = int(curr_x), int(curr_y)

        # Move mouse cursor using Fast Win32 API & PyAutoGUI event system
        try:
            ctypes.windll.user32.SetCursorPos(ix, iy)
        except Exception:
            pass
            
        try:
            pyautogui.moveTo(ix, iy, _pause=False)
        except Exception:
            pass

        return ix, iy
