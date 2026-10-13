import { SlidersHorizontal } from 'lucide-react';
import type { GestureControlItem, GestureStatus } from '../types';
import { GestureCard } from './GestureCard';

interface GestureControlsProps {
  gestures: GestureControlItem[];
  currentGesture: GestureStatus | null;
  onToggleGesture: (id: string, enabled: boolean) => void;
}

export const GestureControls: React.FC<GestureControlsProps> = ({
  gestures,
  currentGesture,
  onToggleGesture,
}) => {
  const activeCount = gestures.filter((g) => g.enabled).length;

  const isTriggered = (id: string) => {
    if (!currentGesture || !currentGesture.name) return false;
    const name = currentGesture.name;
    switch (id) {
      case 'cursor': return name === 'INDEX_POINT';
      case 'click': return name === 'PINCH';
      case 'drag': return name === 'PINCH_DRAG';
      case 'scroll': return name === 'TWO_FINGERS';
      case 'volume': return name === 'THUMB_UP' || name === 'THUMB_DOWN';
      case 'home': return name === 'OPEN_PALM';
      default: return false;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Gesture Controls</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {activeCount} / {gestures.length} Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {gestures.map((item) => (
          <GestureCard
            key={item.id}
            item={item}
            isCurrentlyTriggered={isTriggered(item.id)}
            onToggle={onToggleGesture}
          />
        ))}
      </div>
    </div>
  );
};
