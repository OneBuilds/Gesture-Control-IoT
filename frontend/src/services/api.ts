import type { AppConfig, CameraDevice, BackendStatus, SystemTelemetry } from "../types";

const API_BASE = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws";

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error("Failed to fetch configuration");
  return res.json();
}

export async function updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update configuration");
  return res.json();
}

export async function fetchCameras(): Promise<CameraDevice[]> {
  const res = await fetch(`${API_BASE}/cameras`);
  if (!res.ok) throw new Error("Failed to enumerate cameras");
  return res.json();
}

export async function selectCamera(deviceId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/camera/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId }),
  });
  if (!res.ok) throw new Error("Failed to select camera device");
}

export async function togglePauseApi(paused?: boolean): Promise<{ paused: boolean }> {
  const res = await fetch(`${API_BASE}/pause`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paused !== undefined ? { paused } : {}),
  });
  if (!res.ok) throw new Error("Failed to update pause state");
  return res.json();
}

export async function updateCalibrationApi(bounds: { x_min: number; x_max: number; y_min: number; y_max: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/calibrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bounds),
  });
  if (!res.ok) throw new Error("Failed to update calibration bounds");
}

export async function clearActivityApi(): Promise<void> {
  const res = await fetch(`${API_BASE}/activity`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to clear activity history");
}

class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private statusListeners: Array<(status: BackendStatus) => void> = [];
  private telemetryListeners: Array<(telemetry: SystemTelemetry) => void> = [];
  private reconnectTimer: number | null = null;
  private currentStatus: BackendStatus = "Connecting";

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus("Connecting");

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.setStatus("Connected");
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "telemetry") {
            this.notifyTelemetry(data as SystemTelemetry);
          }
        } catch (e) {
          console.error("[WebSocket] Parse error:", e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus("Disconnected");
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn("[WebSocket] Connection error:", err);
        this.setStatus("Error");
      };
    } catch (e) {
      this.setStatus("Error");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer === null) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.setStatus("Reconnecting");
        this.connect();
      }, 2500);
    }
  }

  send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onStatusChange(cb: (status: BackendStatus) => void) {
    this.statusListeners.push(cb);
    cb(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== cb);
    };
  }

  onTelemetry(cb: (telemetry: SystemTelemetry) => void) {
    this.telemetryListeners.push(cb);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter(l => l !== cb);
    };
  }

  private setStatus(status: BackendStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach(cb => cb(status));
  }

  private notifyTelemetry(telemetry: SystemTelemetry) {
    this.telemetryListeners.forEach(cb => cb(telemetry));
  }
}

export const wsService = new TelemetryWebSocket();
