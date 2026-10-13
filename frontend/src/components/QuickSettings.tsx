import React from 'react';
import { Sliders, Camera, MousePointer, ShieldCheck } from 'lucide-react';
import type { AppConfig, CameraDevice } from '../types';

interface QuickSettingsProps {
  config: AppConfig | null;
  cameras: CameraDevice[];
  onSelectCamera: (deviceId: number) => void;
  onUpdateConfig: (updated: Partial<AppConfig>) => void;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  config,
  cameras,
  onSelectCamera,
  onUpdateConfig,
}) => {
  const currentDevId = config?.camera?.device_id ?? 0;
  const sensitivity = config?.cursor?.sensitivity ?? 1.2;
  const smoothing = config?.cursor?.smoothing ?? 0.65;
  const toggles = config?.gestures ?? {
    cursor: true,
    click: true,
    drag: true,
    scroll: true,
    volume: true,
    home: true,
  };

  const handleSensitivityChange = (val: number) => {
    if (!config) return;
    onUpdateConfig({
      cursor: { ...config.cursor, sensitivity: val },
    });
  };

  const handleSmoothingChange = (val: number) => {
    if (!config) return;
    onUpdateConfig({
      cursor: { ...config.cursor, smoothing: val },
    });
  };

  const handleToggle = (key: keyof typeof toggles, value: boolean) => {
    if (!config) return;
    onUpdateConfig({
      gestures: { ...config.gestures, [key]: value },
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sliders className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Quick Settings</h3>
        </div>
        <span className="text-xs text-slate-400">Real-time parameters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Camera Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            Camera Device
          </label>
          <select
            value={currentDevId}
            onChange={(e) => onSelectCamera(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            {cameras.length === 0 ? (
              <option value={0}>Integrated Webcam (Default)</option>
            ) : (
              cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.name} ({cam.resolution})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Sensitivity & Smoothing Sliders */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                Cursor Sensitivity
              </span>
              <span className="font-mono text-blue-400">{sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={sensitivity}
              onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Cursor Smoothing</span>
              <span className="font-mono text-blue-400">{smoothing.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={smoothing}
              onChange={(e) => handleSmoothingChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Feature Toggles
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            {[
              { key: 'cursor', label: 'Cursor Control' },
              { key: 'click', label: 'Click Action' },
              { key: 'drag', label: 'Drag & Drop' },
              { key: 'scroll', label: 'Scrolling' },
              { key: 'volume', label: 'Volume' },
              { key: 'home', label: 'Home Gesture' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded hover:bg-slate-900">
                <span className="text-slate-300 text-[11px]">{item.label}</span>
                <input
                  type="checkbox"
                  checked={toggles[item.key as keyof typeof toggles]}
                  onChange={(e) => handleToggle(item.key as keyof typeof toggles, e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
