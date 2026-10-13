import json
import os
from typing import Dict, Any

DEFAULT_CONFIG: Dict[str, Any] = {
    "camera": {
        "device_id": 0,
        "width": 1280,
        "height": 720,
    },
    "cursor": {
        "sensitivity": 1.2,
        "smoothing": 0.65,
        "x_min": 0.1,
        "x_max": 0.9,
        "y_min": 0.1,
        "y_max": 0.9,
    },
    "safety": {
        "hold_duration": 1.0,       # seconds to confirm open palm home
        "cooldown_duration": 0.5,   # seconds default cooldown for discrete actions
        "min_confidence": 0.45,
    },
    "gestures": {
        "cursor": True,
        "click": True,
        "drag": True,
        "scroll": True,
        "volume": True,
        "home": True,
    },
    "application": {
        "start_with_windows": False,
        "minimize_to_background": False,
        "port": 8000,
        "pause_shortcut": "space",
    }
}

class ConfigManager:
    def __init__(self, config_path: str = "config.json"):
        self.config_path = config_path
        self._config = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    data = json.load(f)
                    # Merge defaults with saved config
                    merged = self._deep_merge(DEFAULT_CONFIG, data)
                    return merged
            except Exception as e:
                print(f"[ConfigManager] Error loading config, using defaults: {e}")
                return json.loads(json.dumps(DEFAULT_CONFIG))
        return json.loads(json.dumps(DEFAULT_CONFIG))

    def _deep_merge(self, default: dict, override: dict) -> dict:
        result = default.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result

    def get_all(self) -> Dict[str, Any]:
        return self._config

    def update(self, new_config: Dict[str, Any]) -> Dict[str, Any]:
        self._config = self._deep_merge(self._config, new_config)
        self.save()
        return self._config

    def save(self):
        try:
            with open(self.config_path, "w") as f:
                json.dump(self._config, f, indent=2)
        except Exception as e:
            print(f"[ConfigManager] Error saving config: {e}")
