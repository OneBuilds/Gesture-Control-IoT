import os
import cv2
import time
import urllib.request
import numpy as np
import mediapipe as mp
from typing import Dict, Any, Optional, List, Tuple

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
MODEL_FILENAME = "hand_landmarker.task"

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),        # Index
    (5, 9), (9, 10), (10, 11), (11, 12),   # Middle
    (9, 13), (13, 14), (14, 15), (15, 16), # Ring
    (13, 17), (17, 18), (18, 19), (19, 20),# Pinky
    (0, 17)                                # Palm base
]

class HandTracker:
    def __init__(self, model_path: str = MODEL_FILENAME, max_num_hands: int = 1, min_detection_confidence: float = 0.5):
        self.model_path = model_path
        self._ensure_model_exists()
        
        base_options = mp.tasks.BaseOptions(model_asset_path=self.model_path)
        options = mp.tasks.vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_hands=max_num_hands,
            min_hand_detection_confidence=min_detection_confidence,
            min_hand_presence_confidence=min_detection_confidence,
            min_tracking_confidence=min_detection_confidence
        )
        self.landmarker = mp.tasks.vision.HandLandmarker.create_from_options(options)

    def _ensure_model_exists(self):
        if not os.path.exists(self.model_path):
            print(f"[HandTracker] Downloading MediaPipe model from {MODEL_URL}...")
            try:
                urllib.request.urlretrieve(MODEL_URL, self.model_path)
                print("[HandTracker] MediaPipe model downloaded successfully.")
            except Exception as e:
                print(f"[HandTracker] Error downloading model: {e}")

    def process(self, frame_bgr: np.ndarray) -> Tuple[Dict[str, Any], np.ndarray]:
        """
        Processes an OpenCV BGR frame.
        Returns:
            telemetry: Dict with tracking state, landmarks, handedness, confidence.
            annotated_frame: OpenCV BGR frame with visual hand landmarks drawn.
        """
        if frame_bgr is None:
            return {
                "detected": False,
                "landmarks": [],
                "handedness": None,
                "confidence": None,
                "timestamp": time.time()
            }, frame_bgr

        annotated_frame = frame_bgr.copy()
        h, w, _ = frame_bgr.shape

        # Convert BGR to RGB for MediaPipe Image
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        try:
            results = self.landmarker.detect(mp_image)
        except Exception as e:
            print(f"[HandTracker] Detection error: {e}")
            return {
                "detected": False,
                "landmarks": [],
                "handedness": None,
                "confidence": None,
                "timestamp": time.time()
            }, annotated_frame

        if not results.hand_landmarks or len(results.hand_landmarks) == 0:
            return {
                "detected": False,
                "landmarks": [],
                "handedness": None,
                "confidence": None,
                "timestamp": time.time()
            }, annotated_frame

        # Extract primary hand landmarks
        hand_lms = results.hand_landmarks[0]
        
        # Extract handedness and confidence score
        handedness_label = "Right"
        confidence = 0.85
        if results.handedness and len(results.handedness) > 0:
            top_category = results.handedness[0][0]
            handedness_label = top_category.category_name
            confidence = round(float(top_category.score), 2)

        # Convert landmarks to normalized dictionary list
        landmarks = []
        pixel_points = []
        for lm in hand_lms:
            px = int(lm.x * w)
            py = int(lm.y * h)
            pixel_points.append((px, py))
            landmarks.append({
                "x": round(float(lm.x), 4),
                "y": round(float(lm.y), 4),
                "z": round(float(lm.z), 4)
            })

        # Draw skeleton connections
        for start_idx, end_idx in HAND_CONNECTIONS:
            if start_idx < len(pixel_points) and end_idx < len(pixel_points):
                p1 = pixel_points[start_idx]
                p2 = pixel_points[end_idx]
                cv2.line(annotated_frame, p1, p2, (255, 191, 0), 2, cv2.LINE_AA) # Cyan-blue line

        # Draw joint nodes
        for idx, pt in enumerate(pixel_points):
            # Highlight index tip (8) and thumb tip (4) in vibrant green
            if idx in [4, 8]:
                cv2.circle(annotated_frame, pt, 7, (0, 255, 127), -1, cv2.LINE_AA)
                cv2.circle(annotated_frame, pt, 9, (255, 255, 255), 1, cv2.LINE_AA)
            else:
                cv2.circle(annotated_frame, pt, 4, (0, 140, 255), -1, cv2.LINE_AA)

        telemetry = {
            "detected": True,
            "landmarks": landmarks,
            "handedness": handedness_label,
            "confidence": confidence,
            "timestamp": time.time()
        }

        return telemetry, annotated_frame

    def close(self):
        try:
            self.landmarker.close()
        except Exception:
            pass
