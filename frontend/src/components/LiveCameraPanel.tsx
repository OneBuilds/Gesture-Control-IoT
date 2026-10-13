import React, { useState } from 'react';
import { Camera, EyeOff, Hand } from 'lucide-react';
import type { CameraTelemetry, HandTelemetry, BackendStatus } from '../types';

interface LiveCameraPanelProps {
  camera: CameraTelemetry | null;
  hand: HandTelemetry | null;
  backendStatus: BackendStatus;
  onRefresh: () => void;
}

export const LiveCameraPanel: React.FC<LiveCameraPanelProps> = ({
  camera,
  hand,
  backendStatus,
  onRefresh,
}) => {
  const [imgError, setImgError] = useState(false);

  const isBackendOnline = backendStatus === 'Connected';
  const isStreaming = camera?.status === 'streaming' && !imgError;
  const isHandDetected = hand?.detected ?? false;

  const streamUrl = "http://localhost:8000/api/camera/stream";

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-800 shadow-xl relative overflow-hidden group min-h-[360px]">
      {/* Top Telemetry Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Camera Feed</h3>
            <p className="text-[11px] text-slate-400">Real-time hand tracking and landmark detection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hand Detection Badge */}
          {isStreaming && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isHandDetected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Hand className="w-3 h-3" />
              {isHandDetected ? `Hand Detected (${hand?.handedness ?? 'Hand'})` : 'Hand Not Detected'}
            </span>
          )}

          {/* Confidence Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900/80 text-slate-300 border border-slate-800">
            Conf: <span className="text-blue-400">{hand?.confidence != null ? hand.confidence.toFixed(2) : '—'}</span>
          </span>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="my-3 relative flex-1 min-h-[260px] rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-center overflow-hidden">
        {isBackendOnline && isStreaming ? (
          <img
            src={streamUrl}
            alt="Live Hand Tracking Stream"
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
            className="w-full h-full object-contain max-h-[340px]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
              <EyeOff className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-300">
                {!isBackendOnline ? 'Backend Disconnected' : camera?.status === 'initializing' ? 'Initializing Camera...' : 'Camera Unavailable'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {!isBackendOnline
                  ? 'Attempting to reconnect to Python control service...'
                  : 'No active webcam feed available. Ensure device is connected and selected.'}
              </p>
            </div>
            <button
              onClick={() => {
                setImgError(false);
                onRefresh();
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Floating No-Hand Overlay prompt when streaming but no hand in frame */}
        {isBackendOnline && isStreaming && !isHandDetected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Move your hand into the camera frame
          </div>
        )}
      </div>

      {/* Bottom Telemetry Metrics Bar */}
      <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800/60 font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Res: <strong className="text-slate-200">{camera?.width && camera?.height ? `${camera.width} × ${camera.height}` : '—'}</strong>
          </span>
          <span>
            Processing FPS: <strong className="text-blue-400">{camera?.fps != null ? camera.fps.toFixed(1) : '—'}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] font-sans text-slate-400">Truthful Hardware Telemetry</span>
        </div>
      </div>
    </div>
  );
};
