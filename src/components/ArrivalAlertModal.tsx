import React, { useState } from 'react';
import { X, Bell, BellRing, Volume2, Check } from 'lucide-react';
import { playTransitChime } from '../utils/audioAlert';

interface ArrivalAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceNo: string | null;
  busStopCode: string;
  busStopDesc: string;
  onConfirmAlarm: (serviceNo: string, busStopCode: string, targetMinutes: number) => void;
}

export const ArrivalAlertModal: React.FC<ArrivalAlertModalProps> = ({
  isOpen,
  onClose,
  serviceNo,
  busStopCode,
  busStopDesc,
  onConfirmAlarm,
}) => {
  if (!isOpen || !serviceNo) return null;

  const [selectedMinutes, setSelectedMinutes] = useState<number>(2);

  const handleTestSound = () => {
    playTransitChime();
  };

  const handleConfirm = () => {
    onConfirmAlarm(serviceNo, busStopCode, selectedMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Set Arrival Reminder</h3>
              <p className="text-xs text-slate-400">
                Service <span className="font-mono font-bold text-white">{serviceNo}</span> at Stop {busStopCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Notify me before arrival:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedMinutes === mins
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-base font-mono">{mins}m</span>
                  <span className="text-[10px] font-normal uppercase opacity-80">before</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Plays a pleasant transit bell chime</span>
            </div>
            <button
              type="button"
              onClick={handleTestSound}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Test Sound
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Keep this browser tab open to receive timely countdown updates and arrival alerts.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Enable Reminder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
