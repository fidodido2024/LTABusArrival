import React from 'react';
import { SAMPLE_ROUTES, BUS_OPERATOR_COLORS, SINGAPORE_BUS_STOPS } from '../data/singaporeBusData';
import { BusRoute, RouteStop } from '../types/bus';
import { X, MapPin, Bus, Clock, Compass, ArrowRight } from 'lucide-react';

interface RouteViewerModalProps {
  serviceNo: string | null;
  currentStopCode: string;
  onClose: () => void;
  onSelectStop?: (stopCode: string) => void;
}

const MRT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NSL: { bg: 'bg-red-600', text: 'text-white', label: 'North-South' },
  EWL: { bg: 'bg-emerald-600', text: 'text-white', label: 'East-West' },
  NEL: { bg: 'bg-purple-600', text: 'text-white', label: 'North-East' },
  CCL: { bg: 'bg-amber-500', text: 'text-slate-950', label: 'Circle Line' },
  DTL: { bg: 'bg-blue-600', text: 'text-white', label: 'Downtown' },
  TEL: { bg: 'bg-amber-800', text: 'text-white', label: 'Thomson-East Coast' },
};

export const RouteViewerModal: React.FC<RouteViewerModalProps> = ({
  serviceNo,
  currentStopCode,
  onClose,
  onSelectStop,
}) => {
  if (!serviceNo) return null;

  const route: BusRoute | undefined = SAMPLE_ROUTES[serviceNo];

  // If service has no hardcoded stops in sample, generate plausible sequence from known stops
  const stops: RouteStop[] = route
    ? route.Stops
    : [
        { StopSequence: 1, BusStopCode: '08057', RoadName: 'Orchard Rd', Description: 'Dhoby Ghaut Stn', Distance: 0 },
        { StopSequence: 2, BusStopCode: '09038', RoadName: 'Orchard Rd', Description: 'Opp Somerset Stn', Distance: 1.4 },
        { StopSequence: 3, BusStopCode: '01012', RoadName: 'Victoria St', Description: 'Bugis Stn Exit A', Distance: 3.2 },
        { StopSequence: 4, BusStopCode: '05049', RoadName: 'Eu Tong Sen St', Description: 'Chinatown Stn Exit E', Distance: 5.1 },
        { StopSequence: 5, BusStopCode: '14141', RoadName: 'Telok Blangah Rd', Description: 'HarbourFront Stn', Distance: 8.4 },
      ];

  const operatorInfo = BUS_OPERATOR_COLORS[route?.Operator || 'SBST'] || BUS_OPERATOR_COLORS.SBST;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono px-3 py-1 bg-emerald-600 text-white rounded-lg">
              {serviceNo}
            </span>
            <div>
              <h3 className="font-bold text-white text-base">
                {route ? `${route.Origin.split('(')[0]} ➔ ${route.Destination.split('(')[0]}` : `Service ${serviceNo} Route`}
              </h3>
              <p className="text-xs text-slate-400">
                Operated by {operatorInfo.name} · Direction {route?.Direction || 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close route viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Metadata bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">First Bus</span>
            <span className="font-mono font-medium text-slate-200">{route?.FirstBusWeekday || '05:30'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Last Bus</span>
            <span className="font-mono font-medium text-slate-200">{route?.LastBusWeekday || '23:45'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Peak Headway</span>
            <span className="font-mono font-medium text-slate-200">{route?.HeadwayPeak || '4-7 mins'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Off-Peak</span>
            <span className="font-mono font-medium text-slate-200">{route?.HeadwayOffPeak || '8-12 mins'}</span>
          </div>
        </div>

        {/* Stops Sequence Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0 relative">
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
            <span>ROUTE SEQUENCE ({stops.length} KEY STOPS)</span>
            <span className="text-emerald-400 font-mono">● LIVE BUS LOCATIONS</span>
          </div>

          <div className="relative pl-6">
            {/* Vertical timeline spine */}
            <div className="absolute left-2.5 top-3 bottom-4 w-0.5 bg-slate-800" />

            {stops.map((stop, idx) => {
              const isCurrent = stop.BusStopCode === currentStopCode;
              const isBus1Approaching = idx === 1; // Simulated live bus approaching stop 2
              const isBus2Approaching = idx === 3; // Simulated 2nd bus

              // Find MRT connections from Singapore stop dataset
              const stopMeta = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === stop.BusStopCode);
              const mrtLines = stopMeta?.mrtConnections || [];

              return (
                <div key={stop.BusStopCode + idx} className="relative pb-6 last:pb-2 group">
                  {/* Timeline node */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-500 border-white ring-4 ring-emerald-500/30'
                        : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'
                    }`}
                  >
                    {isCurrent ? (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    ) : (
                      <div className="w-1 h-1 bg-slate-600 rounded-full" />
                    )}
                  </div>

                  {/* Stop Information card */}
                  <div
                    onClick={() => {
                      if (onSelectStop) {
                        onSelectStop(stop.BusStopCode);
                        onClose();
                      }
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-950/40 border border-emerald-500/50'
                        : 'hover:bg-slate-800/60 border border-transparent hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                          {stop.Description}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                            YOU ARE HERE
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-slate-400">
                        {stop.Distance} km
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="font-mono text-slate-300">{stop.BusStopCode}</span>
                      <span>·</span>
                      <span>{stop.RoadName}</span>
                      {mrtLines.length > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                          {mrtLines.map((line) => (
                            <span
                              key={line}
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                MRT_COLORS[line]?.bg || 'bg-slate-700'
                              } ${MRT_COLORS[line]?.text || 'text-white'}`}
                              title={`${MRT_COLORS[line]?.label || line} Line`}
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live bus position indicators */}
                    {isBus1Approaching && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-900/40 border border-emerald-700/50 text-[11px] text-emerald-300 font-medium">
                        <Bus className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>Next Bus approaching here (~2m)</span>
                      </div>
                    )}

                    {isBus2Approaching && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-medium">
                        <Bus className="w-3.5 h-3.5 text-slate-400" />
                        <span>2nd Bus on the way (~8m)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Tap any stop to switch view</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
