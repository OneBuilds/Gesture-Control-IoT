import { Sliders, Hand, LayoutDashboard, RefreshCw } from 'lucide-react';
import type { CameraTelemetry, BackendStatus } from '../types';

interface SidebarProps {
  activePage: string;
  onSelectPage: (page: string) => void;
  camera: CameraTelemetry | null;
  backendStatus: BackendStatus;
  onRefreshCamera: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  camera,
  backendStatus,
  onRefreshCamera,
}) => {
  const isStreaming = camera?.status === 'streaming';
  const isBackendOnline = backendStatus === 'Connected';

  const navItems = [
    { id: 'control', label: 'Control', icon: LayoutDashboard },
    { id: 'gestures', label: 'Gestures', icon: Hand },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0f172a]/70 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Camera Telemetry Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStreaming && isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-200">
                {isStreaming && isBackendOnline ? 'Camera Connected' : 'Camera Disconnected'}
              </span>
            </div>
            <button
              onClick={onRefreshCamera}
              title="Refresh Camera Connection"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
            <div className="flex justify-between">
              <span className="text-slate-500">Device:</span>
              <span className="font-mono text-slate-300 truncate max-w-[120px]">
                {camera?.deviceName ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={`font-mono capitalize ${isStreaming ? 'text-emerald-400' : 'text-slate-400'}`}>
                {camera?.status ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resolution:</span>
              <span className="font-mono text-slate-300">
                {camera?.width && camera?.height ? `${camera.width} × ${camera.height}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FPS:</span>
              <span className="font-mono text-slate-300">
                {camera?.fps != null ? `${Math.round(camera.fps)}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
