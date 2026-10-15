import React from 'react';
import { X, Users, AlertTriangle, ShieldCheck, Bus, Accessibility, Info } from 'lucide-react';
import { LOAD_CONFIG, BUS_TYPE_NAMES } from './LoadIndicator';
import { BusLoad, BusType } from '../types/bus';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const loads: { code: BusLoad; desc: string; advice: string }[] = [
    {
      code: 'SEA',
      desc: 'Seats Available. Ample seating is currently vacant throughout the bus cabin.',
      advice: 'Great time to board. Recommended for long journeys.',
    },
    {
      code: 'SDA',
      desc: 'Standing Available. All passenger seats are taken, but standing room is comfortable.',
      advice: 'Fast boarding; expect to stand comfortably.',
    },
    {
      code: 'LSD',
      desc: 'Limited Standing. Bus is crowded to near-maximum capacity.',
      advice: 'The app will trigger an alert! Check if 2nd Bus behind has Seats Available.',
    },
  ];

  const busTypes: { code: BusType; name: string; capacity: string; description: string }[] = [
    {
      code: 'DD',
      name: 'Double Deck',
      capacity: '~120-135 passengers',
      description: 'Two-level high capacity bus. Upper deck typically has available seats even during peak hours.',
    },
    {
      code: 'SD',
      name: 'Single Deck',
      capacity: '~60-80 passengers',
      description: 'Standard single-tier city bus serving high-frequency and feeder routes.',
    },
    {
      code: 'BD',
      name: 'Bendy Bus',
      capacity: '~130-145 passengers',
      description: 'Articulated extra-long bus with 3 passenger doors for high-density passenger trunk corridors.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                LTA Bus Load & Capacity Guide
              </h3>
              <p className="text-xs text-slate-400">
                Official Singapore Land Transport Authority standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section: Load capacity levels */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              1. Passenger Load Capacity Indicators
            </h4>
            <div className="space-y-3">
              {loads.map((item) => {
                const cfg = LOAD_CONFIG[item.code];
                return (
                  <div
                    key={item.code}
                    className={`p-3.5 rounded-xl border ${cfg.bg} ${cfg.border} flex flex-col gap-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${cfg.text} bg-slate-950/40 border border-current/20`}>
                          {item.code}
                        </span>
                        <span className={`font-bold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-3.5 rounded-sm ${cfg.barCount >= 1 ? 'bg-current opacity-100' : 'bg-current opacity-20'} ${cfg.text}`} />
                        <span className={`w-1.5 h-4.5 rounded-sm ${cfg.barCount >= 2 ? 'bg-current opacity-100' : 'bg-current opacity-20'} ${cfg.text}`} />
                        <span className={`w-1.5 h-5.5 rounded-sm ${cfg.barCount >= 3 ? 'bg-current opacity-100' : 'bg-current opacity-20'} ${cfg.text}`} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                    <p className="text-[11px] text-slate-400 font-medium">💡 {item.advice}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Bus Fleet Models */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-emerald-400" />
              2. Bus Deck Types & Fleet
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {busTypes.map((t) => (
                <div
                  key={t.code}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                        {t.code}
                      </span>
                      <span className="font-semibold text-xs text-white">{t.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                      {t.capacity}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility note */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
            <Accessibility className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Wheelchair Accessible Bus (WAB)</strong>
              All Singapore public buses deployed on these lines feature step-free low-floor boarding ramps for wheelchair accessibility and strollers.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
