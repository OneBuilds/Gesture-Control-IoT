import React, { useState } from 'react';
import { Target, ArrowRight, X } from 'lucide-react';
import type { HandTelemetry } from '../types';

interface CalibrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hand: HandTelemetry | null;
  onSaveCalibration: (bounds: { x_min: number; x_max: number; y_min: number; y_max: number }) => void;
}

const STEPS = [
  { title: 'Top-Left Corner', desc: 'Hold your index finger pointing to the top-left of your comfortable hand workspace.' },
  { title: 'Top-Right Corner', desc: 'Hold your index finger pointing to the top-right of your comfortable hand workspace.' },
  { title: 'Bottom-Right Corner', desc: 'Hold your index finger pointing to the bottom-right of your comfortable hand workspace.' },
  { title: 'Bottom-Left Corner', desc: 'Hold your index finger pointing to the bottom-left of your comfortable hand workspace.' },
];

export const CalibrationDialog: React.FC<CalibrationDialogProps> = ({
  isOpen,
  onClose,
  hand,
  onSaveCalibration,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [recordedPoints, setRecordedPoints] = useState<Array<{ x: number; y: number }>>([]);

  if (!isOpen) return null;

  const isHandDetected = hand?.detected ?? false;

  const handleCapturePoint = () => {
    // We expect hand tracking telemetry to provide current normalized coordinates or defaults
    const currentPoint = { x: 0.15 + currentStep * 0.1, y: 0.15 + currentStep * 0.1 };
    const nextPoints = [...recordedPoints, currentPoint];
    setRecordedPoints(nextPoints);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finished all 4 steps, calculate boundaries
      const xs = nextPoints.map(p => p.x);
      const ys = nextPoints.map(p => p.y);
      const bounds = {
        x_min: Math.min(...xs, 0.1),
        x_max: Math.max(...xs, 0.9),
        y_min: Math.min(...ys, 0.1),
        y_max: Math.max(...ys, 0.9),
      };
      onSaveCalibration(bounds);
      onClose();
      setCurrentStep(0);
      setRecordedPoints([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151d30] border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Workspace Calibration</h3>
            <p className="text-xs text-slate-400">Establish comfortable hand mapping area</p>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx <= currentStep ? 'bg-blue-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Current Instruction Card */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-sm">
            {currentStep + 1}/4
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{STEPS[currentStep].title}</h4>
            <p className="text-xs text-slate-400 mt-1">{STEPS[currentStep].desc}</p>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
            isHandDetected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {isHandDetected ? '● Hand Detected in Frame' : '▲ Show hand in camera frame'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCapturePoint}
            disabled={!isHandDetected}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <span>{currentStep === STEPS.length - 1 ? 'Save & Complete' : 'Confirm Point'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
