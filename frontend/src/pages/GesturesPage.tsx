import { MousePointer, MousePointerClick, Move, ArrowUpDown, Volume2, Home, Shield } from 'lucide-react';
import type { AppConfig } from '../types';

interface GesturesPageProps {
  config: AppConfig | null;
  onUpdateConfig: (updated: Partial<AppConfig>) => void;
}

const GESTURE_DETAILS = [
  {
    id: 'cursor',
    name: 'Index Finger Pointing',
    action: 'Move Mouse Cursor',
    icon: MousePointer,
    reqs: 'Index finger fully extended upward. Middle, ring, and pinky fingers folded into palm.',
    cooldown: 'Continuous real-time tracking (0ms)',
    hold: 'Immediate',
  },
  {
    id: 'click',
    name: 'Thumb + Index Pinch',
    action: 'Left Mouse Click',
    icon: MousePointerClick,
    reqs: 'Bring thumb tip and index fingertip together until normalized distance ratio < 0.28.',
    cooldown: '0.5s safety cooldown',
    hold: 'Single discrete frame trigger',
  },
  {
    id: 'drag',
    name: 'Pinch + Hand Movement',
    action: 'Drag and Drop',
    icon: Move,
    reqs: 'Hold pinch active while moving hand > 3% normalized workspace distance.',
    cooldown: 'Active until pinch release',
    hold: 'Continuous while pinched',
  },
  {
    id: 'scroll',
    name: 'Two Fingers Extended',
    action: 'Mouse Wheel Scroll',
    icon: ArrowUpDown,
    reqs: 'Index and middle fingers extended parallel. Vertical displacement controls direction.',
    cooldown: '100ms rate-limited scroll',
    hold: 'Continuous while held',
  },
  {
    id: 'volume',
    name: 'Thumb Up / Down',
    action: 'System Volume Control',
    icon: Volume2,
    reqs: 'Thumb pointing distinctly up or down while other four fingers are folded into fist.',
    cooldown: '0.5s rate-limited step',
    hold: 'Step change per confirmation',
  },
  {
    id: 'home',
    name: 'Open Palm Held',
    action: 'Home / Reset UI',
    icon: Home,
    reqs: 'All five fingers extended flat towards camera held stable for confirmation duration.',
    cooldown: '1.5s Home reset cooldown',
    hold: '1.0s continuous stability',
  },
];

export const GesturesPage: React.FC<GesturesPageProps> = ({ config, onUpdateConfig }) => {
  const toggles = config?.gestures ?? {
    cursor: true,
    click: true,
    drag: true,
    scroll: true,
    volume: true,
    home: true,
  };

  const handleToggle = (key: string, value: boolean) => {
    if (!config) return;
    onUpdateConfig({
      gestures: { ...config.gestures, [key]: value },
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white">Gesture Configuration Library</h2>
        <p className="text-xs text-slate-400 mt-1">
          Detailed recognition requirements, cooldowns, and safety triggers for all six MVP gestures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GESTURE_DETAILS.map((g) => {
          const Icon = g.icon;
          const isEnabled = toggles[g.id as keyof typeof toggles] ?? true;

          return (
            <div
              key={g.id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                isEnabled ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{g.name}</h3>
                    <p className="text-xs text-blue-400 font-medium">{g.action}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToggle(g.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Recognition Requirements:
                  </span>
                  <p className="text-slate-400 mt-1 pl-5 leading-relaxed">{g.reqs}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 font-mono text-[11px]">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block">Cooldown:</span>
                    <span className="text-slate-300">{g.cooldown}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block">Hold Rule:</span>
                    <span className="text-slate-300">{g.hold}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
