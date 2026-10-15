import React from 'react';
import { BusLoad, BusType } from '../types/bus';
import { Users, Accessibility } from 'lucide-react';

interface LoadIndicatorProps {
  load: BusLoad;
  type?: BusType;
  isWab?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const LOAD_CONFIG: Record<BusLoad, { label: string; shortLabel: string; bg: string; text: string; border: string; barCount: number }> = {
  SEA: {
    label: 'Seats Available',
    shortLabel: 'Seats Avail',
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    barCount: 1,
  },
  SDA: {
    label: 'Standing Available',
    shortLabel: 'Standing Only',
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    barCount: 2,
  },
  LSD: {
    label: 'Limited Standing (Crowded)',
    shortLabel: 'Crowded / Full',
    bg: 'bg-rose-500/15 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/40',
    barCount: 3,
  },
};

export const BUS_TYPE_NAMES: Record<BusType, { name: string; tag: string }> = {
  SD: { name: 'Single Deck', tag: 'SD' },
  DD: { name: 'Double Deck', tag: 'DD' },
  BD: { name: 'Bendy Bus', tag: 'BD' },
};

export const LoadIndicator: React.FC<LoadIndicatorProps> = ({
  load,
  type,
  isWab = true,
  size = 'md',
  showLabel = true,
}) => {
  const config = LOAD_CONFIG[load] || LOAD_CONFIG.SEA;

  return (
    <div className="inline-flex items-center gap-1.5 font-sans">
      {/* Visual Capacity Bar Meter */}
      <div
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded border ${config.bg} ${config.border} ${config.text}`}
        title={`${config.label}${type ? ` · ${BUS_TYPE_NAMES[type].name}` : ''}`}
      >
        <div className="flex items-center gap-0.5 mr-1" aria-hidden="true">
          <span
            className={`w-1 rounded-sm transition-all ${
              size === 'sm' ? 'h-2' : 'h-3'
            } ${config.barCount >= 1 ? 'bg-current opacity-100' : 'bg-current opacity-20'}`}
          />
          <span
            className={`w-1 rounded-sm transition-all ${
              size === 'sm' ? 'h-2.5' : 'h-3.5'
            } ${config.barCount >= 2 ? 'bg-current opacity-100' : 'bg-current opacity-20'}`}
          />
          <span
            className={`w-1 rounded-sm transition-all ${
              size === 'sm' ? 'h-3' : 'h-4'
            } ${config.barCount >= 3 ? 'bg-current opacity-100' : 'bg-current opacity-20'}`}
          />
        </div>

        {showLabel && (
          <span className={`font-semibold tracking-tight ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
            {size === 'sm' ? config.shortLabel : config.label}
          </span>
        )}

        {type && (
          <span className="text-[10px] font-mono font-bold uppercase opacity-80 pl-1 border-l border-current/20">
            {type}
          </span>
        )}
      </div>

      {isWab && (
        <span
          title="Wheelchair Accessible Bus (WAB)"
          className="inline-flex items-center justify-center p-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-300 transition-colors"
        >
          <Accessibility className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </span>
      )}
    </div>
  );
};
