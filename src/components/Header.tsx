import React from 'react';
import { Bus, MapPin, Bookmark, HelpCircle, Settings, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'arrivals' | 'radar' | 'saved';
  setActiveTab: (tab: 'arrivals' | 'radar' | 'saved') => void;
  onOpenLegend: () => void;
  onOpenSettings: () => void;
  onNearMeClick: () => void;
  isBackendMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenLegend,
  onOpenSettings,
  onNearMeClick,
  isBackendMode,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-900/40">
            <Bus className="w-4 h-4" />
          </div>
          <button
            onClick={() => setActiveTab('arrivals')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              SG Bus Arrival
            </span>
          </button>
        </div>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('arrivals')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'arrivals' ? 'text-emerald-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Bus Timings
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'radar' ? 'text-emerald-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Nearby Stops
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'saved' ? 'text-emerald-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Saved Stops
          </button>
          <button
            onClick={onOpenLegend}
            className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            LTA Crowd Guide
          </button>
        </nav>

        {/* Zone 3: 1 primary action / utility cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenSettings}
            className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Backend API / Datamall"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backend API</span>
          </button>

          <button
            onClick={onNearMeClick}
            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Near Me</span>
          </button>
        </div>
      </div>
    </header>
  );
};
