import { Radio, ShieldAlert, PauseCircle, AlertCircle } from 'lucide-react';
import type { BackendStatus, CameraTelemetry } from '../types';

interface HeaderProps {
  backendStatus: BackendStatus;
  isPaused: boolean;
  camera: CameraTelemetry | null;
  activePage: string;
}

export const Header: React.FC<HeaderProps> = ({ backendStatus, isPaused, camera, activePage }) => {
  const getPageTitle = () => {
    switch (activePage) {
      case 'gestures': return 'Gesture Library';
      case 'settings': return 'System Settings';
      default: return 'Control Center';
    }
  };

  const getPageDescription = () => {
    switch (activePage) {
      case 'gestures': return 'Configure recognition parameters, cooldowns, and safety thresholds';
      case 'settings': return 'Customize hardware input, cursor mapping, and system auto-start';
      default: return 'Use your hand gestures to control your desktop touchlessly';
    }
  };

  const renderStatusBadge = () => {
    if (backendStatus !== 'Connected') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5 animate-spin" />
          Backend {backendStatus}
        </span>
      );
    }

    if (isPaused) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <PauseCircle className="w-3.5 h-3.5" />
          System Paused
        </span>
      );
    }

    if (!camera || camera.status !== 'streaming') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          Camera Disconnected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
        System Active
      </span>
    );
  };

  return (
    <header className="px-6 py-4 border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">AirControl</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              MVP 1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Touchless Desktop Control</p>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center">
        <h2 className="text-sm font-semibold text-slate-200">{getPageTitle()}</h2>
        <p className="text-xs text-slate-400">{getPageDescription()}</p>
      </div>

      <div className="flex items-center gap-3">
        {renderStatusBadge()}
      </div>
    </header>
  );
};
