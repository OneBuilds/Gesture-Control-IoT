import sys
import time
import ctypes
import pyautogui

# Disable PyAutoGUI pause for testing
pyautogui.PAUSE = 0
pyautogui.FAILSAFE = False

print("==========================================")
print("   AIRCONTROL OS-CONTROL ISOLATED TEST    ")
print("==========================================")

# 1. Screen Dimensions
try:
    user32 = ctypes.windll.user32
    user32.SetProcessDPIAware()
    sw, sh = user32.GetSystemMetrics(0), user32.GetSystemMetrics(1)
    print(f"[TEST 1] Screen Dimensions (Win32 DPI Aware): {sw} x {sh}")
except Exception as e:
    sw, sh = pyautogui.size()
    print(f"[TEST 1] Screen Dimensions (PyAutoGUI): {sw} x {sh} (Error: {e})")

# 2. Mouse Cursor Movement
print("\n[TEST 2] Testing Mouse Cursor Movement...")
try:
    # Center
    cx, cy = sw // 2, sh // 2
    print(f" -> Moving cursor to center: ({cx}, {cy})")
    ctypes.windll.user32.SetCursorPos(cx, cy)
    pyautogui.moveTo(cx, cy, _pause=False)
    time.sleep(0.5)

    # Top-Left (200, 200)
    print(" -> Moving cursor to (200, 200)")
    ctypes.windll.user32.SetCursorPos(200, 200)
    pyautogui.moveTo(200, 200, _pause=False)
    time.sleep(0.5)

    # Bottom-Right (sw - 200, sh - 200)
    rx, ry = sw - 200, sh - 200
    print(f" -> Moving cursor to ({rx}, {ry})")
    ctypes.windll.user32.SetCursorPos(rx, ry)
    pyautogui.moveTo(rx, ry, _pause=False)
    time.sleep(0.5)

    # Return to center
    ctypes.windll.user32.SetCursorPos(cx, cy)
    pyautogui.moveTo(cx, cy, _pause=False)
    print("[TEST 2] Cursor Movement PASSED.")
except Exception as e:
    print(f"[TEST 2] Cursor Movement FAILED: {e}")

# 3. Left Click Test
print("\n[TEST 3] Testing Left Click...")
try:
    pyautogui.click()
    print("[TEST 3] Left Click PASSED.")
except Exception as e:
    print(f"[TEST 3] Left Click FAILED: {e}")

# 4. Scroll Test
print("\n[TEST 4] Testing Scroll...")
try:
    pyautogui.scroll(120)
    time.sleep(0.2)
    pyautogui.scroll(-120)
    print("[TEST 4] Scroll PASSED.")
except Exception as e:
    print(f"[TEST 4] Scroll FAILED: {e}")

# 5. Volume Test
print("\n[TEST 5] Testing Volume Control...")
try:
    from pycaw.pycaw import AudioUtilities
    device = AudioUtilities.GetSpeakers()
    if device and hasattr(device, 'EndpointVolume'):
        vol_ctrl = device.EndpointVolume
        curr = vol_ctrl.GetMasterVolumeLevelScalar()
        print(f" -> Current Master Volume: {int(curr * 100)}%")
        # Adjust up slightly then back
        new_v = min(1.0, curr + 0.02)
        vol_ctrl.SetMasterVolumeLevelScalar(new_v, None)
        time.sleep(0.2)
        vol_ctrl.SetMasterVolumeLevelScalar(curr, None)
        print("[TEST 5] Native Pycaw Volume Control PASSED.")
    else:
        print("[TEST 5] Pycaw device EndpointVolume unavailable.")
except Exception as e:
    print(f"[TEST 5] Volume Control FAILED: {e}")

print("\n==========================================")
print("   OS CONTROL TEST SUITE COMPLETE         ")
print("==========================================")
