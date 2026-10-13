import { History, Trash2, ArrowRight } from 'lucide-react';
import type { ActivityEntry } from '../types';

interface RecentActivityProps {
  activity: ActivityEntry[];
  onClear: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activity, onClear }) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3 min-h-[280px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <History className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>

        {activity.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded bg-slate-900 border border-slate-800"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex-1 overflow-y-auto max-h-[220px] space-y-1.5">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-xs text-slate-500 space-y-1">
            <History className="w-5 h-5 text-slate-600" />
            <p>No recent gesture actions recorded.</p>
            <p className="text-[10px] text-slate-600">Real OS events will appear here.</p>
          </div>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">{item.timestamp}</span>
                <span className="font-semibold text-slate-200">
                  {item.gesture.replace('_', ' ')}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-blue-400">{item.action}</span>
              </div>
              {item.details && (
                <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                  {item.details}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="pt-1 text-[11px] text-slate-500 text-right">
        Confirmed system actions log
      </div>
    </div>
  );
};
