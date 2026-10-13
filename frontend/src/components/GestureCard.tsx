import { MousePointer, MousePointerClick, Move, ArrowUpDown, Volume2, Home, type LucideIcon } from 'lucide-react';
import type { GestureControlItem } from '../types';

interface GestureCardProps {
  item: GestureControlItem;
  isCurrentlyTriggered: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}

const GESTURE_ICONS: Record<string, LucideIcon> = {
  cursor: MousePointer,
  click: MousePointerClick,
  drag: Move,
  scroll: ArrowUpDown,
  volume: Volume2,
  home: Home,
};

export const GestureCard: React.FC<GestureCardProps> = ({ item, isCurrentlyTriggered, onToggle }) => {
  const Icon = GESTURE_ICONS[item.id] || MousePointer;

  return (
    <div
      className={`glass-card rounded-xl p-3.5 transition-all flex items-center justify-between border ${
        isCurrentlyTriggered
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-[1.02]'
          : item.enabled
          ? 'border-slate-800 hover:border-slate-700'
          : 'border-slate-800/50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isCurrentlyTriggered
              ? 'bg-blue-500 text-white shadow-md'
              : item.enabled
              ? 'bg-slate-800 text-blue-400'
              : 'bg-slate-900 text-slate-600'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white">{item.name}</h4>
          <p className="text-[11px] text-slate-400">{item.action}</p>
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={item.enabled}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
};
