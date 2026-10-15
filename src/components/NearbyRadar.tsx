import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { POPULAR_LOCATIONS } from '../data/singaporeBusData';
import { getNearbyBusStops } from '../services/ltaService';
import { MapPin, Navigation, Compass, ChevronRight, Bus } from 'lucide-react';

interface NearbyRadarProps {
  onSelectBusStop: (busStopCode: string) => void;
  selectedStopCode: string;
}

export const NearbyRadar: React.FC<NearbyRadarProps> = ({
  onSelectBusStop,
  selectedStopCode,
}) => {
  // Default coordinates: Orchard / Dhoby Ghaut Singapore
  const [currentCoord, setCurrentCoord] = useState<{ lat: number; lng: number; label: string }>({
    lat: 1.2995,
    lng: 103.8458,
    label: 'Dhoby Ghaut / Orchard Rd',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const nearbyStops = getNearbyBusStops(currentCoord.lat, currentCoord.lng, 10);

  const handleUseBrowserGeo = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCurrentCoord({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Current GPS Location',
        });
      },
      (err) => {
        setIsLocating(false);
        setGeoError('Unable to retrieve location. Switched to Singapore Hubs.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-6 text-slate-100">
      {/* Title & GPS action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            Nearby Bus Stops Radar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Locating near: <strong className="text-slate-200">{currentCoord.label}</strong>
          </p>
        </div>

        <button
          onClick={handleUseBrowserGeo}
          disabled={isLocating}
          className="h-9 px-3.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS'}</span>
        </button>
      </div>

      {geoError && (
        <div className="mb-4 text-xs text-amber-300 bg-amber-950/40 border border-amber-900/50 p-2.5 rounded-lg">
          {geoError}
        </div>
      )}

      {/* Popular Singapore Hub quick buttons */}
      <div className="mb-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          Or Select Singapore Commuter Hub
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = currentCoord.label === loc.name;
            return (
              <button
                key={loc.code}
                onClick={() => {
                  setCurrentCoord({ lat: loc.lat, lng: loc.lng, label: loc.name });
                  onSelectBusStop(loc.code);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stops Radar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {nearbyStops.map((stop) => {
          const isSelected = stop.BusStopCode === selectedStopCode;
          const walkMins = Math.max(1, Math.round(stop.distanceMeters / 80));

          return (
            <div
              key={stop.BusStopCode}
              onClick={() => onSelectBusStop(stop.BusStopCode)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                  : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    {stop.BusStopCode}
                  </span>
                  <span className="font-semibold text-sm text-white truncate">
                    {stop.Description}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                  <span>{stop.RoadName}</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    {stop.distanceMeters}m ({walkMins} min walk)
                  </span>
                </div>

                {/* Available services at this stop */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {stop.Services.slice(0, 6).map((svc) => (
                    <span
                      key={svc}
                      className="px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 font-mono text-[11px] font-semibold"
                    >
                      {svc}
                    </span>
                  ))}
                  {stop.Services.length > 6 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{stop.Services.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight
                className={`w-5 h-5 shrink-0 ${
                  isSelected ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
