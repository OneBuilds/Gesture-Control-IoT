export type CameraStatus = "disconnected" | "initializing" | "streaming" | "error";
export type BackendStatus = "Connecting" | "Connected" | "Disconnected" | "Reconnecting" | "Error";

export interface CameraTelemetry {
  status: CameraStatus;
  deviceName: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  deviceId: number;
}

export interface HandTelemetry {
  detected: boolean;
  confidence: number | null;
  handedness: string | null;
}

export interface GestureStatus {
  name: string | null;
  confidence: number | null;
  action: string | null;
  state: "IDLE" | "CANDIDATE" | "CONFIRMED" | "ACTION" | "COOLDOWN";
}

export interface GestureControlItem {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  iso: string;
  gesture: string;
  action: string;
  details?: string;
}

export interface SystemTelemetry {
  type: "telemetry";
  system: {
    active: boolean;
    paused: boolean;
  };
  camera: CameraTelemetry;
  hand: HandTelemetry;
  gesture: GestureStatus;
  gestures: GestureControlItem[];
  activity: ActivityEntry[];
  timestamp: number;
}

export interface CameraDevice {
  id: number;
  name: string;
  resolution: string;
}

export interface AppConfig {
  camera: {
    device_id: number;
    width: number;
    height: number;
  };
  cursor: {
    sensitivity: number;
    smoothing: number;
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
  safety: {
    hold_duration: number;
    cooldown_duration: number;
    min_confidence: number;
  };
  gestures: {
    cursor: boolean;
    click: boolean;
    drag: boolean;
    scroll: boolean;
    volume: boolean;
    home: boolean;
  };
  application: {
    start_with_windows: boolean;
    minimize_to_background: boolean;
    port: number;
    pause_shortcut: string;
  };
}
