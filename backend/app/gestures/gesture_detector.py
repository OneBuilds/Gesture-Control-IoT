import math
from typing import Dict, Any, Optional, Tuple

class GestureDetector:
    """
    Analyzes 21 MediaPipe hand landmarks and computes geometric relations to recognize gestures.
    Landmarks map:
      0: WRIST
      1-4: THUMB (CMC, MCP, IP, TIP)
      5-8: INDEX (MCP, PIP, DIP, TIP)
      9-12: MIDDLE (MCP, PIP, DIP, TIP)
      13-16: RING (MCP, PIP, DIP, TIP)
      17-20: PINKY (MCP, PIP, DIP, TIP)
    """

    @staticmethod
    def _dist(p1: Dict[str, float], p2: Dict[str, float]) -> float:
        return math.sqrt((p1["x"] - p2["x"]) ** 2 + (p1["y"] - p2["y"]) ** 2 + (p1["z"] - p2["z"]) ** 2)

    @classmethod
    def detect_gesture(cls, landmarks: list, hand_confidence: float) -> Tuple[Optional[str], float, Dict[str, Any]]:
        if not landmarks or len(landmarks) < 21:
            return None, 0.0, {}

        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_mcp = landmarks[2]

        index_tip = landmarks[8]
        index_pip = landmarks[6]
        index_mcp = landmarks[5]

        middle_tip = landmarks[12]
        middle_pip = landmarks[10]
        middle_mcp = landmarks[9]

        ring_tip = landmarks[16]
        ring_pip = landmarks[14]
        ring_mcp = landmarks[13]

        pinky_tip = landmarks[20]
        pinky_pip = landmarks[18]
        pinky_mcp = landmarks[17]

        # Reference scale: distance between wrist and middle MCP
        scale = cls._dist(wrist, middle_mcp)
        if scale < 0.001:
            scale = 0.001

        # Distance ratio relative to MCP distance from wrist (orientation-invariant)
        d_wrist_index_mcp = max(0.001, cls._dist(wrist, index_mcp))
        d_wrist_middle_mcp = max(0.001, cls._dist(wrist, middle_mcp))
        d_wrist_ring_mcp = max(0.001, cls._dist(wrist, ring_mcp))
        d_wrist_pinky_mcp = max(0.001, cls._dist(wrist, pinky_mcp))

        index_ext = (cls._dist(wrist, index_tip) / d_wrist_index_mcp) > 1.25
        middle_ext = (cls._dist(wrist, middle_tip) / d_wrist_middle_mcp) > 1.25
        ring_ext = (cls._dist(wrist, ring_tip) / d_wrist_ring_mcp) > 1.25
        pinky_ext = (cls._dist(wrist, pinky_tip) / d_wrist_pinky_mcp) > 1.25

        # Pinch distance ratio (thumb tip to index tip normalized by scale)
        pinch_dist = cls._dist(thumb_tip, index_tip) / scale
        is_pinched = pinch_dist < 0.40

        # 1. PINCH / PINCH_DRAG: Thumb and Index tips close together
        if is_pinched:
            conf = min(0.99, max(0.65, 1.0 - (pinch_dist / 0.40)))
            return "PINCH", conf, {
                "pinch_center": {
                    "x": (thumb_tip["x"] + index_tip["x"]) / 2,
                    "y": (thumb_tip["y"] + index_tip["y"]) / 2
                },
                "pinch_dist": pinch_dist
            }

        # 2. OPEN_PALM: All 4 fingers extended and thumb extended away
        if index_ext and middle_ext and ring_ext and pinky_ext:
            thumb_dist_wrist = cls._dist(thumb_tip, wrist) / scale
            if thumb_dist_wrist > 0.55:
                conf = min(0.99, hand_confidence * 0.98)
                return "OPEN_PALM", conf, {"landmarks": landmarks}

        # 3. TWO_FINGERS: Index & Middle extended, Ring & Pinky folded
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            conf = min(0.98, hand_confidence * 0.95)
            return "TWO_FINGERS", conf, {
                "index_y": index_tip["y"],
                "middle_y": middle_tip["y"]
            }

        # 4. THUMB_UP / THUMB_DOWN: Thumb extended, other fingers folded
        other_fingers_folded = not index_ext and not middle_ext and not ring_ext and not pinky_ext
        if other_fingers_folded:
            if thumb_tip["y"] < thumb_mcp["y"] - 0.03 * scale:
                return "THUMB_UP", min(0.96, hand_confidence * 0.94), {}
            elif thumb_tip["y"] > thumb_mcp["y"] + 0.03 * scale:
                return "THUMB_DOWN", min(0.96, hand_confidence * 0.94), {}

        # 5. INDEX_POINT: Index extended (primary pointer)
        if index_ext:
            conf = min(0.98, hand_confidence * 0.96)
            return "INDEX_POINT", conf, {
                "index_tip": index_tip
            }

        return None, 0.0, {}
