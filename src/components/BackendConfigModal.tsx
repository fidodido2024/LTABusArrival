import React, { useState } from 'react';
import { BackendConfig, loadBackendConfig, saveBackendConfig } from '../services/ltaService';
import { X, Server, Database, CheckCircle, RefreshCw, Key, Code, AlertCircle } from 'lucide-react';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onSaveConfig: (newConfig: BackendConfig) => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'simulation' | 'backend'>(config.mode);
  const [apiUrl, setApiUrl] = useState<string>(config.apiUrl);
  const [accountKey, setAccountKey] = useState<string>(config.ltaAccountKey || '');
  const [refreshInterval, setRefreshInterval] = useState<number>(config.autoRefreshInterval);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    const updated: BackendConfig = {
      mode,
      apiUrl: apiUrl.trim(),
      ltaAccountKey: accountKey.trim(),
      autoRefreshInterval: refreshInterval,
    };
    saveBackendConfig(updated);
    onSaveConfig(updated);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Backend Connection Setup</h3>
              <p className="text-xs text-slate-400">
                Connect your server API or test with real-time simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Data Source Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('simulation')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'simulation'
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Live Simulator</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accurate Singapore arrivals stream with realistic headways & load fluctuations.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('backend')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'backend'
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Custom Backend</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Route requests to your Express / Cloud Run backend or LTA DataMall proxy.
                </p>
              </button>
            </div>
          </div>

          {/* Backend URL Input */}
          {mode === 'backend' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Backend Endpoint URL
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="/api/bus-arrivals or http://localhost:3000/api/bus-arrivals"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  The frontend appends <code className="text-slate-300">?BusStopCode=...</code> to this endpoint.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Optional LTA DataMall AccountKey (Header)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={accountKey}
                    onChange={(e) => setAccountKey(e.target.value)}
                    placeholder="e.g. gR+K0xxxxxxxxxxxx=="
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Passed in the <code className="text-slate-300">AccountKey</code> request header.
                </span>
              </div>
            </div>
          )}

          {/* Auto Refresh Setting */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Auto-Refresh Rate
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Off', val: 0 },
                { label: '15s', val: 15 },
                { label: '30s', val: 30 },
                { label: '60s', val: 60 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setRefreshInterval(opt.val)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    refreshInterval === opt.val
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Developer Contract Documentation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
              <Code className="w-4 h-4 text-emerald-400" />
              <span>Expected LTA JSON Payload Contract:</span>
            </div>
            <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800/80">
{`{
  "BusStopCode": "08057",
  "Services": [
    {
      "ServiceNo": "190",
      "Operator": "SMRT",
      "NextBus": {
        "EstimatedArrival": "2026-10-15T06:42:00+08:00",
        "Load": "LSD", // SEA | SDA | LSD
        "Type": "BD",  // SD | DD | BD
        "Feature": "WAB"
      },
      "NextBus2": {
        "EstimatedArrival": "2026-10-15T06:49:00+08:00",
        "Load": "SEA",
        "Type": "DD"
      }
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
          >
            {savedNotice ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
