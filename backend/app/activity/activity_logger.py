from datetime import datetime
from typing import List, Dict, Any
import threading

class ActivityLogger:
    def __init__(self, max_entries: int = 20):
        self.max_entries = max_entries
        self.entries: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def log(self, gesture: str, action: str, details: str = "") -> Dict[str, Any]:
        now = datetime.now()
        entry = {
            "id": f"{int(now.timestamp() * 1000)}-{len(self.entries)}",
            "timestamp": now.strftime("%H:%M:%S"),
            "iso": now.isoformat(),
            "gesture": gesture,
            "action": action,
            "details": details
        }
        with self._lock:
            self.entries.insert(0, entry)
            if len(self.entries) > self.max_entries:
                self.entries = self.entries[:self.max_entries]
        return entry

    def get_entries(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self.entries)

    def clear(self):
        with self._lock:
            self.entries.clear()
