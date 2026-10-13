import sys
import ctypes
import os
import subprocess
from typing import Tuple

class WinSystem:
    @staticmethod
    def get_screen_size() -> Tuple[int, int]:
        try:
            user32 = ctypes.windll.user32
            user32.SetProcessDPIAware()
            return user32.GetSystemMetrics(0), user32.GetSystemMetrics(1)
        except Exception:
            import pyautogui
            return pyautogui.size()

    @staticmethod
    def set_start_with_windows(enable: bool, app_name: str = "AirControl") -> bool:
        if sys.platform != "win32":
            return False
        try:
            import winreg
            key = winreg.HKEY_CURRENT_USER
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
            with winreg.OpenKey(key, key_path, 0, winreg.KEY_ALL_ACCESS) as reg_key:
                if enable:
                    # Point to launch script or python main script
                    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "main.py"))
                    python_exe = sys.executable
                    cmd = f'"{python_exe}" "{script_path}"'
                    winreg.SetValueEx(reg_key, app_name, 0, winreg.REG_SZ, cmd)
                else:
                    try:
                        winreg.DeleteValue(reg_key, app_name)
                    except FileNotFoundError:
                        pass
            return True
        except Exception as e:
            print(f"[WinSystem] Failed to update startup registry: {e}")
            return False

    @staticmethod
    def is_start_with_windows_enabled(app_name: str = "AirControl") -> bool:
        if sys.platform != "win32":
            return False
        try:
            import winreg
            key = winreg.HKEY_CURRENT_USER
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
            with winreg.OpenKey(key, key_path, 0, winreg.KEY_READ) as reg_key:
                winreg.QueryValueEx(reg_key, app_name)
                return True
        except Exception:
            return False

    @staticmethod
    def bring_browser_to_foreground():
        """Brings the browser window running AirControl localhost UI to front."""
        if sys.platform != "win32":
            return
        try:
            import win32gui
            import win32con

            def enum_windows_callback(hwnd, extra):
                if win32gui.IsWindowVisible(hwnd):
                    title = win32gui.GetWindowText(hwnd)
                    if "AirControl" in title or "localhost:5173" in title or "127.0.0.1:5173" in title or "5173" in title:
                        # Restore window if minimized
                        if win32gui.IsIconic(hwnd):
                            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                        win32gui.SetForegroundWindow(hwnd)
                        return False
                return True

            win32gui.EnumWindows(enum_windows_callback, None)
        except Exception as e:
            print(f"[WinSystem] Error bringing window to foreground: {e}")
