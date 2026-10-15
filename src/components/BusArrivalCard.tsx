import React, { useState } from 'react';
import { BusServiceArrival, NextBusInfo, BusStop } from '../types/bus';
import { LoadIndicator, LOAD_CONFIG, BUS_TYPE_NAMES } from './LoadIndicator';
import { BUS_OPERATOR_COLORS } from '../data/singaporeBusData';
import { AlertTriangle, Bell, BellRing, Route, Star, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface BusArrivalCardProps {
  service: BusServiceArrival;
  currentStop: BusStop;
  isStarred: boolean;
  onToggleStar: (serviceNo: string) => void;
  onOpenRoute: (serviceNo: string) => void;
  onSetAlarm: (serviceNo: string, busStopCode: string, targetMinutes: number) => void;
  hasActiveAlarm?: boolean;
}

function formatMinutes(seconds: number): string {
  if (seconds <= 40) return 'Arr';
  if (seconds < 90) return '1 min';
  const mins = Math.floor(seconds / 60);
  return `${mins} mins`;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  service,
  currentStop,
  isStarred,
  onToggleStar,
  onOpenRoute,
  onSetAlarm,
  hasActiveAlarm = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const operator = BUS_OPERATOR_COLORS[service.Operator] || BUS_OPERATOR_COLORS.SBST;

  const next1 = service.NextBus;
  const next2 = service.NextBus2;
  const next3 = service.NextBus3;

  // Determine smart load alert
  const isBus1Crowded = next1?.Load === 'LSD';
  const isBus2Seats = next2?.Load === 'SEA';
  const isBothCrowded = next1?.Load === 'LSD' && next2?.Load === 'LSD';

  const bus2Mins = next2 ? Math.floor(next2.secondsRemaining / 60) : null;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isStarred
          ? 'bg-slate-900/90 border-amber-500/40 shadow-sm shadow-amber-950/20'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Main Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Service number & Operator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleStar(service.ServiceNo)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isStarred ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'
              }`}
              title={isStarred ? 'Remove from favorites' : 'Star this service'}
              aria-label={`Star service ${service.ServiceNo}`}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
                {service.ServiceNo}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {operator.name}
              </span>
            </div>
          </div>

          {/* Incoming Buses Forecast: Next Bus & 2nd Bus */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4">
            {/* Next Bus */}
            <div className="flex flex-col p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 min-w-[120px] sm:min-w-[140px]">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Next Bus
                </span>
                {next1 && (
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {next1.secondsRemaining}s
                  </span>
                )}
              </div>

              {next1 ? (
                <>
                  <div className="flex items-baseline gap-1 my-0.5">
                    <span
                      className={`text-lg sm:text-xl font-bold font-mono tracking-tight tabular-nums ${
                        next1.secondsRemaining <= 40 ? 'text-emerald-400 animate-pulse' : 'text-white'
                      }`}
                    >
                      {formatMinutes(next1.secondsRemaining)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <LoadIndicator
                      load={next1.Load}
                      type={next1.Type}
                      isWab={next1.Feature === 'WAB'}
                      size="sm"
                    />
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-500 py-1">Not operating</span>
              )}
            </div>

            {/* 2nd Bus */}
            <div className="flex flex-col p-2.5 sm:p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 min-w-[120px] sm:min-w-[140px]">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  2nd Bus
                </span>
                {next2 && (
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {next2.secondsRemaining}s
                  </span>
                )}
              </div>

              {next2 ? (
                <>
                  <div className="flex items-baseline gap-1 my-0.5">
                    <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-slate-200 tabular-nums">
                      {formatMinutes(next2.secondsRemaining)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <LoadIndicator
                      load={next2.Load}
                      type={next2.Type}
                      isWab={next2.Feature === 'WAB'}
                      size="sm"
                    />
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-500 py-1">No 2nd bus</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:self-center justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
            <button
              onClick={() => onOpenRoute(service.ServiceNo)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="View bus route and stops"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Route</span>
            </button>

            <button
              onClick={() => onSetAlarm(service.ServiceNo, currentStop.BusStopCode, 2)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                hasActiveAlarm
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Set arrival alert reminder"
            >
              {hasActiveAlarm ? (
                <>
                  <BellRing className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>Alert On</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notify</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle extra bus details"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Smart Load Capacity Alert Banner */}
        {isBus1Crowded && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-300">Crowded Bus Alert: </span>
              {isBothCrowded ? (
                <span>
                  Next 2 incoming buses have <strong>Limited Standing (LSD)</strong>. Expect heavy boarding crowds.
                </span>
              ) : isBus2Seats && bus2Mins !== null ? (
                <span>
                  Next bus is packed full. Consider taking 2nd bus in ~{bus2Mins} mins (
                  {BUS_TYPE_NAMES[next2!.Type].name}) which has{' '}
                  <strong className="text-emerald-300">Seats Available</strong>!
                </span>
              ) : (
                <span>
                  Next bus has <strong>Limited Standing (LSD)</strong>. Boarding may be restricted.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Collapsible 3rd Bus & Detailed breakdown */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/30 p-2.5 rounded-lg">
            <div>
              <span className="text-slate-500 font-medium">3rd Incoming Bus: </span>
              {next3 ? (
                <span className="font-mono font-semibold text-slate-200">
                  {formatMinutes(next3.secondsRemaining)} ({BUS_TYPE_NAMES[next3.Type].name} · {LOAD_CONFIG[next3.Load].label})
                </span>
              ) : (
                <span className="text-slate-500">Scheduled later</span>
              )}
            </div>
            <div>
              <span className="text-slate-500 font-medium">Frequency: </span>
              <span className="text-slate-200">Peak 4-7m · Off-peak 8-12m</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Current Stop: </span>
              <span className="font-mono text-emerald-400">{currentStop.BusStopCode}</span> ({currentStop.Description})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
