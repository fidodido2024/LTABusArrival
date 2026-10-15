import { BusArrivalResponse, BusServiceArrival, NextBusInfo, BusLoad, BusType, BusStop, OperatorCode } from '../types/bus';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBusData';

export interface BackendConfig {
  mode: 'simulation' | 'backend';
  apiUrl: string;
  ltaAccountKey?: string;
  autoRefreshInterval: number; // in seconds, 0 = off, 15, 30, 60
}

const DEFAULT_CONFIG: BackendConfig = {
  mode: 'simulation',
  apiUrl: '/api/busarrival',
  ltaAccountKey: '',
  autoRefreshInterval: 15,
};

// Local storage key for custom backend preferences
const STORAGE_KEY = 'sg_bus_backend_config';

export async function checkServerlessHealth(): Promise<{ status: string; ltaKeyConfigured: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // serverless backend not reachable yet or offline
  }
  return { status: 'offline', ltaKeyConfigured: false };
}

export function loadBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to parse backend config from localStorage', e);
  }
  return DEFAULT_CONFIG;
}


export function saveBackendConfig(config: BackendConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save backend config to localStorage', e);
  }
}

// In-memory persistent state for simulated live buses so countdowns tick smoothly
interface SimulationCacheEntry {
  busStopCode: string;
  services: Map<string, {
    operator: OperatorCode;
    bus1Arrival: number; // epoch ms
    bus1Load: BusLoad;
    bus1Type: BusType;
    bus2Arrival: number;
    bus2Load: BusLoad;
    bus2Type: BusType;
    bus3Arrival: number;
    bus3Load: BusLoad;
    bus3Type: BusType;
  }>;
}

const simulationCache = new Map<string, SimulationCacheEntry>();

function getOperatorForService(serviceNo: string): OperatorCode {
  if (['190', '960', '851', '961', '970'].includes(serviceNo)) return 'SMRT';
  if (['106', '77', '143', '66', '78', '79'].includes(serviceNo)) return 'TTS';
  if (['36', '2', '12', '12e', '34', '85'].includes(serviceNo)) return 'GAS';
  return 'SBST';
}

function getRandomLoad(index: number, serviceSeed: number): BusLoad {
  // Deterministic yet dynamic load patterns
  const hash = (serviceSeed * 17 + index * 31 + Math.floor(Date.now() / 60000)) % 10;
  if (hash <= 4) return 'SEA'; // 50% Seats Available
  if (hash <= 7) return 'SDA'; // 30% Standing Available
  return 'LSD'; // 20% Limited Standing (crowded)
}

function getRandomBusType(serviceNo: string): BusType {
  const num = parseInt(serviceNo, 10);
  if (['190', '960', '857'].includes(serviceNo)) return 'BD'; // Bendy or High capacity
  if (!isNaN(num) && num % 2 === 0) return 'DD'; // Double Deck
  return 'SD';
}

/**
 * Initializes or updates realistic arrival intervals for a given bus stop
 */
function getOrGenerateStopSimulation(busStopCode: string, services: string[]): BusServiceArrival[] {
  const now = Date.now();
  let entry = simulationCache.get(busStopCode);

  if (!entry) {
    entry = {
      busStopCode,
      services: new Map(),
    };
    simulationCache.set(busStopCode, entry);
  }

  // Ensure every service has arrival predictions
  services.forEach((svc, index) => {
    let svcData = entry!.services.get(svc);
    const serviceSeed = (parseInt(svc.replace(/\D/g, ''), 10) || 10) + index * 7;

    if (!svcData || svcData.bus1Arrival < now - 35000) {
      // First bus is 0.5 to 4 mins away
      const headway1 = (45 + ((serviceSeed * 37) % 240)) * 1000;
      const bus1Arrival = now + headway1;
      
      // Second bus is 4 to 9 mins behind first bus
      const headway2 = (240 + ((serviceSeed * 47) % 360)) * 1000;
      const bus2Arrival = bus1Arrival + headway2;

      // Third bus is 6 to 12 mins behind second bus
      const headway3 = (360 + ((serviceSeed * 53) % 480)) * 1000;
      const bus3Arrival = bus2Arrival + headway3;

      svcData = {
        operator: getOperatorForService(svc),
        bus1Arrival,
        bus1Load: getRandomLoad(1, serviceSeed),
        bus1Type: getRandomBusType(svc),
        bus2Arrival,
        bus2Load: getRandomLoad(2, serviceSeed),
        bus2Type: (serviceSeed % 3 === 0) ? 'DD' : 'SD',
        bus3Arrival,
        bus3Load: 'SEA',
        bus3Type: 'SD',
      };
      entry!.services.set(svc, svcData);
    } else if (svcData.bus1Arrival < now && svcData.bus2Arrival > now) {
      // First bus has arrived/departed, shift 2nd to 1st, generate new 3rd
      if (now - svcData.bus1Arrival > 30000) {
        const newHeadway = (380 + ((serviceSeed * 29) % 320)) * 1000;
        svcData.bus1Arrival = svcData.bus2Arrival;
        svcData.bus1Load = svcData.bus2Load;
        svcData.bus1Type = svcData.bus2Type;

        svcData.bus2Arrival = svcData.bus3Arrival;
        svcData.bus2Load = svcData.bus3Load;
        svcData.bus2Type = svcData.bus3Type;

        svcData.bus3Arrival = svcData.bus2Arrival + newHeadway;
        svcData.bus3Load = getRandomLoad(3, serviceSeed);
        svcData.bus3Type = 'DD';
      }
    }
  });

  // Transform into LTA standard response format
  const result: BusServiceArrival[] = [];

  services.forEach((svc) => {
    const data = entry!.services.get(svc)!;
    
    const bus1Sec = Math.max(0, Math.round((data.bus1Arrival - now) / 1000));
    const bus2Sec = Math.max(0, Math.round((data.bus2Arrival - now) / 1000));
    const bus3Sec = Math.max(0, Math.round((data.bus3Arrival - now) / 1000));

    const bus1: NextBusInfo = {
      OriginCode: '00000',
      DestinationCode: '99999',
      EstimatedArrival: new Date(data.bus1Arrival).toISOString(),
      Latitude: '1.3000',
      Longitude: '103.8500',
      VisitNumber: '1',
      Load: data.bus1Load,
      Feature: 'WAB',
      Type: data.bus1Type,
      secondsRemaining: bus1Sec,
      minutesRemaining: Math.floor(bus1Sec / 60),
    };

    const bus2: NextBusInfo = {
      OriginCode: '00000',
      DestinationCode: '99999',
      EstimatedArrival: new Date(data.bus2Arrival).toISOString(),
      Latitude: '1.3050',
      Longitude: '103.8520',
      VisitNumber: '1',
      Load: data.bus2Load,
      Feature: 'WAB',
      Type: data.bus2Type,
      secondsRemaining: bus2Sec,
      minutesRemaining: Math.floor(bus2Sec / 60),
    };

    const bus3: NextBusInfo = {
      OriginCode: '00000',
      DestinationCode: '99999',
      EstimatedArrival: new Date(data.bus3Arrival).toISOString(),
      Latitude: '1.3100',
      Longitude: '103.8540',
      VisitNumber: '1',
      Load: data.bus3Load,
      Feature: 'WAB',
      Type: data.bus3Type,
      secondsRemaining: bus3Sec,
      minutesRemaining: Math.floor(bus3Sec / 60),
    };

    result.push({
      ServiceNo: svc,
      Operator: data.operator,
      NextBus: bus1,
      NextBus2: bus2,
      NextBus3: bus3,
    });
  });

  // Sort services numerically/alphabetically
  return result.sort((a, b) => {
    const numA = parseInt(a.ServiceNo, 10);
    const numB = parseInt(b.ServiceNo, 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return a.ServiceNo.localeCompare(b.ServiceNo);
  });
}

/**
 * Main service fetcher for bus arrivals at a given bus stop code.
 * If backend mode is enabled, queries user's backend endpoint.
 * Otherwise, uses accurate simulated Singapore bus arrival stream.
 */
export async function fetchBusArrivals(
  busStopCode: string,
  config?: BackendConfig
): Promise<BusArrivalResponse> {
  const activeConfig = config || loadBackendConfig();
  const stopInfo = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === busStopCode);
  const defaultServices = stopInfo ? stopInfo.Services : ['14', '65', '147', '190'];

  if (activeConfig.mode === 'backend' && activeConfig.apiUrl) {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (activeConfig.ltaAccountKey) {
        headers['AccountKey'] = activeConfig.ltaAccountKey;
      }

      const url = new URL(activeConfig.apiUrl, window.location.origin);
      url.searchParams.set('BusStopCode', busStopCode);

      const resp = await fetch(url.toString(), {
        headers,
      });

      if (!resp.ok) {
        throw new Error(`Backend returned status ${resp.status}`);
      }

      const data = await resp.json();
      const now = Date.now();

      // Transform backend LTA Datamall response to attach seconds/minutes remaining
      const mappedServices: BusServiceArrival[] = (data.Services || []).map((s: any) => {
        const parseBus = (raw: any): NextBusInfo | null => {
          if (!raw || !raw.EstimatedArrival) return null;
          const arrivalMs = new Date(raw.EstimatedArrival).getTime();
          const sec = Math.max(0, Math.round((arrivalMs - now) / 1000));
          return {
            OriginCode: raw.OriginCode || '',
            DestinationCode: raw.DestinationCode || '',
            EstimatedArrival: raw.EstimatedArrival,
            Latitude: raw.Latitude || '',
            Longitude: raw.Longitude || '',
            VisitNumber: raw.VisitNumber || '1',
            Load: raw.Load || 'SEA',
            Feature: raw.Feature || 'WAB',
            Type: raw.Type || 'SD',
            secondsRemaining: sec,
            minutesRemaining: Math.floor(sec / 60),
          };
        };

        return {
          ServiceNo: s.ServiceNo,
          Operator: s.Operator || 'SBST',
          NextBus: parseBus(s.NextBus),
          NextBus2: parseBus(s.NextBus2),
          NextBus3: parseBus(s.NextBus3),
        };
      });

      return {
        BusStopCode: busStopCode,
        Services: mappedServices,
        timestamp: Date.now(),
      };
    } catch (err) {
      console.warn('Backend fetch failed, falling back to simulated live timings:', err);
      // Fallback to simulation
    }
  }

  // Simulated live arrivals
  const simulatedServices = getOrGenerateStopSimulation(busStopCode, defaultServices);
  return {
    BusStopCode: busStopCode,
    Services: simulatedServices,
    timestamp: Date.now(),
  };
}

/**
 * Calculate Haversine distance in meters between two lat/lng coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Returns bus stops sorted by distance from specified latitude/longitude
 */
export function getNearbyBusStops(
  userLat: number,
  userLng: number,
  limit = 8
): (BusStop & { distanceMeters: number })[] {
  return SINGAPORE_BUS_STOPS.map((stop) => ({
    ...stop,
    distanceMeters: calculateDistanceMeters(userLat, userLng, stop.Latitude, stop.Longitude),
  }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

/**
 * Filter bus stops by search keyword (code, road, description, service no)
 */
export function searchBusStops(keyword: string): BusStop[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return SINGAPORE_BUS_STOPS.slice(0, 8);

  return SINGAPORE_BUS_STOPS.filter((stop) => {
    return (
      stop.BusStopCode.toLowerCase().includes(q) ||
      stop.RoadName.toLowerCase().includes(q) ||
      stop.Description.toLowerCase().includes(q) ||
      stop.Services.some((svc) => svc.toLowerCase() === q || svc.toLowerCase().startsWith(q))
    );
  });
}
