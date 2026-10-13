import { Camera, MousePointer, ShieldAlert, Monitor } from 'lucide-react';
import type { AppConfig, CameraDevice } from '../types';

interface SettingsPageProps {
  config: AppConfig | null;
  cameras: CameraDevice[];
  onSelectCamera: (id: number) => void;
  onUpdateConfig: (updated: Partial<AppConfig>) => void;
  onOpenCalibration: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  cameras,
  onSelectCamera,
  onUpdateConfig,
  onOpenCalibration,
}) => {
  if (!config) return null;

  const handleSafetyChange = (key: keyof AppConfig['safety'], val: number) => {
    onUpdateConfig({
      safety: { ...config.safety, [key]: val },
    });
  };

  const handleAppChange = (key: keyof AppConfig['application'], val: any) => {
    onUpdateConfig({
      application: { ...config.application, [key]: val },
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white">Application Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure hardware input devices, tracking safety thresholds, and OS integration.
        </p>
      </div>

      {/* 1. Camera Settings */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Camera Hardware</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Selected Video Capture Device</label>
            <select
              value={config.camera.device_id}
              onChange={(e) => onSelectCamera(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.resolution})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Preferred Resolution</label>
            <input
              type="text"
              disabled
              value={`${config.camera.width} × ${config.camera.height} (16:9)`}
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 2. Cursor & Mapping Settings */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MousePointer className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Cursor & Motion Smoothing</h3>
          </div>
          <button
            onClick={onOpenCalibration}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
          >
            Launch Calibration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Cursor Sensitivity Multiplier</span>
              <span className="font-mono text-blue-400">{config.cursor.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={config.cursor.sensitivity}
              onChange={(e) => onUpdateConfig({ cursor: { ...config.cursor, sensitivity: parseFloat(e.target.value) } })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Exponential Filter Smoothing</span>
              <span className="font-mono text-blue-400">{config.cursor.smoothing.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={config.cursor.smoothing}
              onChange={(e) => onUpdateConfig({ cursor: { ...config.cursor, smoothing: parseFloat(e.target.value) } })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Gesture Safety Settings */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Gesture Safety & Debouncing</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Hold Duration (Home)</span>
              <span className="font-mono text-emerald-400">{config.safety.hold_duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={config.safety.hold_duration}
              onChange={(e) => handleSafetyChange('hold_duration', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Action Cooldown</span>
              <span className="font-mono text-emerald-400">{config.safety.cooldown_duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.1"
              value={config.safety.cooldown_duration}
              onChange={(e) => handleSafetyChange('cooldown_duration', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Min Tracking Confidence</span>
              <span className="font-mono text-emerald-400">{config.safety.min_confidence.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.9"
              step="0.05"
              value={config.safety.min_confidence}
              onChange={(e) => handleSafetyChange('min_confidence', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Application Integration Settings */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Monitor className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Application & OS Integration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <div>
              <div className="font-semibold text-white">Start with Windows</div>
              <div className="text-[11px] text-slate-400">Launch background service at OS boot</div>
            </div>
            <input
              type="checkbox"
              checked={config.application.start_with_windows}
              onChange={(e) => handleAppChange('start_with_windows', e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
          </label>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Local Service Port</div>
              <div className="text-[11px] text-slate-400">FastAPI backend listener port</div>
            </div>
            <span className="font-mono text-blue-400 font-bold px-2 py-1 rounded bg-slate-950 border border-slate-800">
              {config.application.port}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
