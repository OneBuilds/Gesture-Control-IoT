import { PauseCircle, PlayCircle, Target, Power } from 'lucide-react';
import type { AppConfig } from '../types';

interface SystemControlsProps {
  isPaused: boolean;
  config: AppConfig | null;
  onTogglePause: () => void;
  onOpenCalibration: () => void;
  onToggleStartup: (enabled: boolean) => void;
}

export const SystemControls: React.FC<SystemControlsProps> = ({
  isPaused,
  config,
  onTogglePause,
  onOpenCalibration,
  onToggleStartup,
}) => {
  const startWithWindows = config?.application?.start_with_windows ?? false;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Power className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-white">System Controls</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pause / Resume Button */}
        <button
          onClick={onTogglePause}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs transition-all shadow-md ${
            isPaused
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
          }`}
        >
          {isPaused ? (
            <>
              <PlayCircle className="w-4 h-4" />
              <span>Resume Control</span>
            </>
          ) : (
            <>
              <PauseCircle className="w-4 h-4" />
              <span>Pause Control</span>
            </>
          )}
          <kbd className="ml-1.5 px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">Space</kbd>
        </button>

        {/* Calibrate Button */}
        <button
          onClick={onOpenCalibration}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
        >
          <Target className="w-4 h-4 text-blue-400" />
          <span>Calibrate Workspace</span>
        </button>

        {/* Open at Startup Toggle Card */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-white">Start with Windows</div>
            <div className="text-[10px] text-slate-400">Auto-launch service</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={startWithWindows}
              onChange={(e) => onToggleStartup(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
