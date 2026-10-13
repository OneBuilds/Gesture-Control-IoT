import { Hand, Sparkles } from 'lucide-react';
import type { GestureStatus } from '../types';

interface CurrentGesturePanelProps {
  gesture: GestureStatus | null;
}

export const CurrentGesturePanel: React.FC<CurrentGesturePanelProps> = ({ gesture }) => {
  const name = gesture?.name ? gesture.name.replace('_', ' ') : 'NO GESTURE';
  const action = gesture?.action ? gesture.action.replace('_', ' ') : 'Waiting for input';
  const confidence = gesture?.confidence;
  const state = gesture?.state ?? 'IDLE';

  const getStateColor = () => {
    switch (state) {
      case 'ACTION': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'CANDIDATE': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'COOLDOWN': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Current Gesture</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStateColor()}`}>
          {state}
        </span>
      </div>

      <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-inner">
          <Hand className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-bold tracking-wide uppercase text-white font-mono">
            {name}
          </h4>
          <p className="text-xs font-medium text-blue-400 mt-0.5">
            {action}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400">Engine Confidence:</span>
        <span className="font-mono font-bold text-slate-200">
          {confidence != null ? `${(confidence * 100).toFixed(0)}% (${confidence.toFixed(2)})` : '—'}
        </span>
      </div>
    </div>
  );
};
