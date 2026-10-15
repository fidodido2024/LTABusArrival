import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SINGAPORE_BUS_STOPS, POPULAR_LOCATIONS } from './data/singaporeBusData';
import { BusStop, BusServiceArrival, ActiveAlarm } from './types/bus';
import { fetchBusArrivals, searchBusStops, loadBackendConfig, BackendConfig } from './services/ltaService';
import { Header } from './components/Header';
import { BusArrivalCard } from './components/BusArrivalCard';
import { NearbyRadar } from './components/NearbyRadar';
import { RouteViewerModal } from './components/RouteViewerModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { LegendModal } from './components/LegendModal';
import { ArrivalAlertModal } from './components/ArrivalAlertModal';
import { playTransitChime } from './utils/audioAlert';
import {
  Search,
  MapPin,
  Bookmark,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
  Info,
  Clock,
  Compass,
  Check,
  Star,
  Users,
  BellRing,
  X,
  Share2
} from 'lucide-react';

const MRT_BADGES: Record<string, { bg: string; text: string }> = {
  NSL: { bg: 'bg-red-600', text: 'text-white' },
  EWL: { bg: 'bg-emerald-600', text: 'text-white' },
  NEL: { bg: 'bg-purple-600', text: 'text-white' },
  CCL: { bg: 'bg-amber-500', text: 'text-slate-950' },
  DTL: { bg: 'bg-blue-600', text: 'text-white' },
  TEL: { bg: 'bg-amber-800', text: 'text-white' },
};

export default function App() {
  // Navigation tabs: arrivals, radar, saved
  const [activeTab, setActiveTab] = useState<'arrivals' | 'radar' | 'saved'>('arrivals');

  // Currently selected bus stop (Default: 08057 Dhoby Ghaut / Orchard Rd)
  const [currentStopCode, setCurrentStopCode] = useState<string>('08057');
  const [servicesData, setServicesData] = useState<BusServiceArrival[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Filter within current stop by service number
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Backend settings & simulation config
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(loadBackendConfig);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);

  // Route viewer modal
  const [routeModalService, setRouteModalService] = useState<string | null>(null);

  // Arrival reminder alert modal & active alarms
  const [alertTargetService, setAlertTargetService] = useState<string | null>(null);
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_alarms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Saved / Bookmarked Bus Stops & Starred Services
  const [savedStopCodes, setSavedStopCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_saved_stops');
      return saved ? JSON.parse(saved) : ['08057', '01012', '14141'];
    } catch {
      return ['08057', '01012'];
    }
  });

  const [starredServices, setStarredServices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_starred_services');
      return saved ? JSON.parse(saved) : ['190', '65'];
    } catch {
      return ['190'];
    }
  });

  const currentStop = useMemo(() => {
    return (
      SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === currentStopCode) ||
      SINGAPORE_BUS_STOPS[0]
    );
  }, [currentStopCode]);

  // Search results dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchBusStops(searchQuery);
  }, [searchQuery]);

  // Load arrival timings
  const loadArrivals = async (stopCode: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetchBusArrivals(stopCode, backendConfig);
      setServicesData(response.Services);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load arrivals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and when stop code changes
  useEffect(() => {
    loadArrivals(currentStopCode);
  }, [currentStopCode, backendConfig.mode, backendConfig.apiUrl]);

  // 1-second interval to tick countdown seconds smoothly down
  useEffect(() => {
    const timer = setInterval(() => {
      setServicesData((prev) =>
        prev.map((svc) => {
          const updateBus = (bus: any) => {
            if (!bus) return null;
            const newSec = Math.max(0, bus.secondsRemaining - 1);
            return {
              ...bus,
              secondsRemaining: newSec,
              minutesRemaining: Math.floor(newSec / 60),
            };
          };

          return {
            ...svc,
            NextBus: updateBus(svc.NextBus),
            NextBus2: updateBus(svc.NextBus2),
            NextBus3: updateBus(svc.NextBus3),
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh interval (15s, 30s, etc.)
  useEffect(() => {
    if (backendConfig.autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadArrivals(currentStopCode, true);
    }, backendConfig.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [currentStopCode, backendConfig.autoRefreshInterval]);

  // Check active alarms against incoming bus timings
  useEffect(() => {
    if (activeAlarms.length === 0) return;

    activeAlarms.forEach((alarm) => {
      if (alarm.busStopCode === currentStopCode && !alarm.soundPlayed) {
        const svc = servicesData.find((s) => s.ServiceNo === alarm.serviceNo);
        if (svc && svc.NextBus) {
          const minsAway = Math.floor(svc.NextBus.secondsRemaining / 60);
          if (minsAway <= alarm.targetMinutes) {
            playTransitChime();
            // Mark alarm as triggered
            setActiveAlarms((prev) =>
              prev.map((a) => (a.id === alarm.id ? { ...a, soundPlayed: true } : a))
            );
          }
        }
      }
    });
  }, [servicesData, activeAlarms, currentStopCode]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('sg_bus_saved_stops', JSON.stringify(savedStopCodes));
  }, [savedStopCodes]);

  useEffect(() => {
    localStorage.setItem('sg_bus_starred_services', JSON.stringify(starredServices));
  }, [starredServices]);

  useEffect(() => {
    localStorage.setItem('sg_bus_alarms', JSON.stringify(activeAlarms));
  }, [activeAlarms]);

  const toggleSaveStop = (code: string) => {
    setSavedStopCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleStarService = (svc: string) => {
    setStarredServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleSetAlarm = (serviceNo: string, busStopCode: string, targetMinutes: number) => {
    const newAlarm: ActiveAlarm = {
      id: `${serviceNo}-${busStopCode}-${Date.now()}`,
      serviceNo,
      busStopCode,
      busStopDesc: currentStop.Description,
      targetMinutes,
      targetSeconds: targetMinutes * 60,
      soundPlayed: false,
    };
    setActiveAlarms((prev) => [...prev.filter((a) => a.serviceNo !== serviceNo), newAlarm]);
  };

  const handleDismissAlarm = (id: string) => {
    setActiveAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // Filtered and sorted services (starred first)
  const displayServices = useMemo(() => {
    let list = servicesData;
    if (serviceFilter !== 'all') {
      list = list.filter((s) => s.ServiceNo === serviceFilter);
    }

    return [...list].sort((a, b) => {
      const aStarred = starredServices.includes(a.ServiceNo);
      const bStarred = starredServices.includes(b.ServiceNo);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      return 0;
    });
  }, [servicesData, serviceFilter, starredServices]);

  // Overall crowd alert count for current stop
  const crowdedServices = useMemo(() => {
    return servicesData.filter((s) => s.NextBus?.Load === 'LSD');
  }, [servicesData]);

  const seatsAvailableServices = useMemo(() => {
    return servicesData.filter((s) => s.NextBus?.Load === 'SEA');
  }, [servicesData]);

  const isCurrentStopSaved = savedStopCodes.includes(currentStopCode);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLegend={() => setIsLegendModalOpen(true)}
        onOpenSettings={() => setIsBackendModalOpen(true)}
        onNearMeClick={() => {
          setActiveTab('radar');
        }}
        isBackendMode={backendConfig.mode === 'backend'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Active Boarding Alarms Banner */}
        {activeAlarms.length > 0 && (
          <div className="space-y-2">
            {activeAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between gap-3 text-xs text-amber-200 animate-pulse-subtle"
              >
                <div className="flex items-center gap-2.5">
                  <BellRing className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                  <div>
                    <span className="font-bold text-white">Boarding Reminder Active: </span>
                    <span>
                      Service <strong className="text-amber-300 font-mono">{alarm.serviceNo}</strong> at{' '}
                      {alarm.busStopDesc} ({alarm.busStopCode}) — Alert set for {alarm.targetMinutes}m before arrival.
                    </span>
                    {alarm.soundPlayed && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        🔔 Bus is arriving now!
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismissAlarm(alarm.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Global Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              placeholder="Search by 5-digit Stop Code (e.g. 01012), Road Name, or Bus Service (e.g. 190, 65)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-lg shadow-black/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
                Matching Bus Stops & Services
              </div>
              {searchResults.map((stop) => (
                <div
                  key={stop.BusStopCode}
                  onMouseDown={() => {
                    setCurrentStopCode(stop.BusStopCode);
                    setSearchQuery('');
                    setActiveTab('arrivals');
                  }}
                  className="p-3.5 hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/60 last:border-b-0 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {stop.BusStopCode}
                      </span>
                      <span className="font-semibold text-sm text-white truncate">
                        {stop.Description}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {stop.RoadName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {stop.Services.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                    {stop.Services.length > 4 && (
                      <span className="text-[10px] text-slate-500">
                        +{stop.Services.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Bus Timings View */}
        {activeTab === 'arrivals' && (
          <div className="space-y-6">
            {/* Bus Stop Hero Banner */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Stop Code & Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-base font-extrabold px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900">
                      {currentStop.BusStopCode}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {currentStop.Description}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="text-slate-300 font-medium">{currentStop.RoadName}</span>
                    <span>·</span>
                    <span>{servicesData.length} operating services</span>
                    {currentStop.mrtConnections && currentStop.mrtConnections.length > 0 && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">MRT:</span>
                          {currentStop.mrtConnections.map((line) => (
                            <span
                              key={line}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                MRT_BADGES[line]?.bg || 'bg-slate-700'
                              } ${MRT_BADGES[line]?.text || 'text-white'}`}
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Bookmark, Refresh, Mode Badge) */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={() => toggleSaveStop(currentStopCode)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrentStopSaved
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={isCurrentStopSaved ? 'Remove from saved stops' : 'Bookmark bus stop'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isCurrentStopSaved ? 'fill-current' : ''}`} />
                    <span>{isCurrentStopSaved ? 'Saved' : 'Save Stop'}</span>
                  </button>

                  <button
                    onClick={() => loadArrivals(currentStopCode)}
                    disabled={isLoading}
                    className="h-9 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Refresh arrival timings"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Real-time Fleet Status & Crowd Summary Bar */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{seatsAvailableServices.length} with Seats</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>{crowdedServices.length} Crowded Alerts</span>
                  </div>
                  <div className="text-slate-500">
                    Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                {backendConfig.mode === 'simulation' ? (
                  <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live SG Simulation Engine</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-blue-400 flex items-center gap-1">
                    <span>Connected to: {backendConfig.apiUrl}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Filters */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setServiceFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    serviceFilter === 'all'
                      ? 'bg-slate-100 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  All Services ({servicesData.length})
                </button>
                {servicesData.map((s) => (
                  <button
                    key={s.ServiceNo}
                    onClick={() => setServiceFilter(s.ServiceNo)}
                    className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      serviceFilter === s.ServiceNo
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {s.ServiceNo}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Arrivals Cards List */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Fetching accurate Singapore arrival estimates...</span>
              </div>
            ) : displayServices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-sm">No bus services matching the current filter.</p>
                <button
                  onClick={() => setServiceFilter('all')}
                  className="mt-3 text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Reset filter to view all
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayServices.map((service) => (
                  <BusArrivalCard
                    key={service.ServiceNo}
                    service={service}
                    currentStop={currentStop}
                    isStarred={starredServices.includes(service.ServiceNo)}
                    onToggleStar={toggleStarService}
                    onOpenRoute={(svc) => setRouteModalService(svc)}
                    onSetAlarm={handleSetAlarm}
                    hasActiveAlarm={activeAlarms.some(
                      (a) => a.serviceNo === service.ServiceNo && a.busStopCode === currentStopCode
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Nearby Stops Radar */}
        {activeTab === 'radar' && (
          <NearbyRadar
            onSelectBusStop={(code) => {
              setCurrentStopCode(code);
              setActiveTab('arrivals');
            }}
            selectedStopCode={currentStopCode}
          />
        )}

        {/* Tab 3: Saved / Bookmarked Stops */}
        {activeTab === 'saved' && (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 sm:p-6 text-slate-100">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
              Saved Bus Stops
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Quickly jump to your frequently boarded Singapore bus stops.
            </p>

            {savedStopCodes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                <Bookmark className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">No saved bus stops yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Save Stop" on any stop card to add it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedStopCodes.map((code) => {
                  const stop = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === code);
                  if (!stop) return null;

                  return (
                    <div
                      key={code}
                      onClick={() => {
                        setCurrentStopCode(code);
                        setActiveTab('arrivals');
                      }}
                      className="p-4 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {stop.BusStopCode}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveStop(code);
                            }}
                            className="text-amber-400 hover:text-amber-300 p-1 cursor-pointer"
                            title="Remove bookmark"
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-white text-sm truncate">
                          {stop.Description}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{stop.RoadName}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>{stop.Services.length} services</span>
                        <span className="text-emerald-400 font-medium hover:underline">
                          View Arrivals →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            Singapore Public Transport Live Arrival Timings & Load Alerts.
            <span className="text-slate-400 block sm:inline sm:ml-1">
              Compliant with LTA DataMall Standards (SEA · SDA · LSD).
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsLegendModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Crowd Guide
            </button>
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Backend API Config
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RouteViewerModal
        serviceNo={routeModalService}
        currentStopCode={currentStopCode}
        onClose={() => setRouteModalService(null)}
        onSelectStop={(code) => {
          setCurrentStopCode(code);
          setActiveTab('arrivals');
        }}
      />

      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={(newConfig) => {
          setBackendConfig(newConfig);
          loadArrivals(currentStopCode);
        }}
      />

      <LegendModal
        isOpen={isLegendModalOpen}
        onClose={() => setIsLegendModalOpen(false)}
      />

      <ArrivalAlertModal
        isOpen={Boolean(alertTargetService)}
        onClose={() => setAlertTargetService(null)}
        serviceNo={alertTargetService}
        busStopCode={currentStopCode}
        busStopDesc={currentStop.Description}
        onConfirmAlarm={handleSetAlarm}
      />
    </div>
  );
}
