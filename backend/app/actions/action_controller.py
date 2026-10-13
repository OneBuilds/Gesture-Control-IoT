import sys
import time
import ctypes
import pyautogui
from typing import Optional, Callable
from app.actions.cursor_controller import CursorController
from app.system.win_system import WinSystem

# Win32 Mouse Event Flags
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_WHEEL = 0x0800

class ActionController:
    def __init__(self, activity_logger=None):
        self.cursor_controller = CursorController()
        self.activity_logger = activity_logger
        self.is_dragging = False
        self._volume_control_available = False
        self._init_pycaw()

    def _init_pycaw(self):
        if sys.platform == "win32":
            try:
                from pycaw.pycaw import AudioUtilities
                device = AudioUtilities.GetSpeakers()
                if device and hasattr(device, 'EndpointVolume'):
                    self.volume_interface = device.EndpointVolume
                    self._volume_control_available = True
                    print("[ActionController] Pycaw native Windows audio control initialized.")
                else:
                    self._volume_control_available = False
            except Exception as e:
                print(f"[ActionController] Pycaw initialization warning: {e}")
                self._volume_control_available = False

    def move_cursor(self, norm_x: float, norm_y: float, sensitivity: float, smoothing: float,
                    x_min: float, x_max: float, y_min: float, y_max: float, paused: bool):
        if paused:
            return
        self.cursor_controller.map_and_move(
            norm_x, norm_y, sensitivity, smoothing, x_min, x_max, y_min, y_max
        )

    def click(self, paused: bool) -> bool:
        if paused:
            return False
        try:
            if sys.platform == "win32":
                user32 = ctypes.windll.user32
                user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                time.sleep(0.01)
                user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
            else:
                pyautogui.click()
            return True
        except Exception as e:
            print(f"[ActionController] Click error: {e}")
            return False

    def start_drag(self, paused: bool) -> bool:
        if paused:
            return False
        if not self.is_dragging:
            try:
                if sys.platform == "win32":
                    ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                else:
                    pyautogui.mouseDown()
                self.is_dragging = True
                return True
            except Exception as e:
                print(f"[ActionController] start_drag error: {e}")
                return False
        return False

    def end_drag(self, paused: bool) -> bool:
        if self.is_dragging:
            try:
                if sys.platform == "win32":
                    ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
                else:
                    pyautogui.mouseUp()
                self.is_dragging = False
                return True
            except Exception as e:
                print(f"[ActionController] end_drag error: {e}")
                self.is_dragging = False
                return False
        return False

    def scroll(self, direction: str, magnitude: float = 1.0, paused: bool = False) -> bool:
        if paused:
            return False
        try:
            steps = int(120 * magnitude if direction == "UP" else -120 * magnitude)
            if sys.platform == "win32":
                ctypes.windll.user32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, steps, 0)
            else:
                pyautogui.scroll(steps)
            return True
        except Exception as e:
            print(f"[ActionController] Scroll error: {e}")
            return False

    def adjust_volume(self, direction: str, step: float = 0.05, paused: bool = False) -> bool:
        if paused:
            return False
        if self._volume_control_available:
            try:
                current_vol = self.volume_interface.GetMasterVolumeLevelScalar()
                if direction == "UP":
                    new_vol = min(1.0, current_vol + step)
                else:
                    new_vol = max(0.0, current_vol - step)
                self.volume_interface.SetMasterVolumeLevelScalar(new_vol, None)
                return True
            except Exception as e:
                print(f"[ActionController] Pycaw volume change error: {e}")
        
        # Keyboard fallback
        try:
            key = "volumeup" if direction == "UP" else "volumedown"
            pyautogui.press(key)
            return True
        except Exception as e:
            print(f"[ActionController] Keyboard volume change error: {e}")
            return False

    def home_reset(self, paused: bool, on_home_callback: Optional[Callable] = None) -> bool:
        # Emergency release active drag state
        if self.is_dragging:
            try:
                if sys.platform == "win32":
                    ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
                else:
                    pyautogui.mouseUp()
            except Exception:
                pass
            self.is_dragging = False

        # Bring AirControl UI window to front
        WinSystem.bring_browser_to_foreground()

        if on_home_callback:
            on_home_callback()
        return True
