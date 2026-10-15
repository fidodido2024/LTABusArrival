export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusFeature = 'WAB' | ''; // Wheelchair Accessible Bus

export type OperatorCode = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface NextBusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 string
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusType;
  // Computed runtime fields
  secondsRemaining: number;
  minutesRemaining: number;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: OperatorCode;
  NextBus: NextBusInfo | null;
  NextBus2: NextBusInfo | null;
  NextBus3: NextBusInfo | null;
}

export interface BusArrivalResponse {
  odata_metadata?: string;
  BusStopCode: string;
  Services: BusServiceArrival[];
  timestamp: number;
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  Services: string[];
  mrtConnections?: string[]; // e.g. ['NSL', 'EWL']
}

export interface RouteStop {
  StopSequence: number;
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Distance: number; // in km
}

export interface BusRoute {
  ServiceNo: string;
  Operator: OperatorCode;
  Direction: 1 | 2;
  Origin: string;
  Destination: string;
  FirstBusWeekday: string;
  LastBusWeekday: string;
  HeadwayPeak: string;
  HeadwayOffPeak: string;
  Stops: RouteStop[];
}

export interface ActiveAlarm {
  id: string;
  serviceNo: string;
  busStopCode: string;
  busStopDesc: string;
  targetMinutes: number;
  targetSeconds: number;
  soundPlayed?: boolean;
}
