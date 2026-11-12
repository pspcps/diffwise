import type { GeoPoint } from './types';

export interface GeoPreset {
  id: string;
  name: string;
  category: 'Major Metros' | 'Transcontinental' | 'Geofence Tests' | 'Aviation & Sea' | 'Extreme Antipodes';
  description: string;
  p1: GeoPoint;
  p2: GeoPoint;
  expectedKm: number;
}

export const GEO_PRESETS: GeoPreset[] = [
  {
    id: 'nyc_london',
    name: 'New York (JFK) ➔ London (LHR)',
    category: 'Transcontinental',
    description: 'Classic transatlantic flight route across the North Atlantic',
    p1: { lat: 40.6413, lon: -73.7781, label: 'New York JFK' },
    p2: { lat: 51.4700, lon: -0.4543, label: 'London Heathrow' },
    expectedKm: 5555,
  },
  {
    id: 'sf_tokyo',
    name: 'San Francisco ➔ Tokyo (Haneda)',
    category: 'Transcontinental',
    description: 'Transpacific great-circle route curving near the Aleutian Islands',
    p1: { lat: 37.7749, lon: -122.4194, label: 'San Francisco' },
    p2: { lat: 35.6762, lon: 139.6503, label: 'Tokyo' },
    expectedKm: 8279,
  },
  {
    id: 'london_paris',
    name: 'London ➔ Paris',
    category: 'Major Metros',
    description: 'Short European high-speed Eurostar rail corridor',
    p1: { lat: 51.5074, lon: -0.1278, label: 'London' },
    p2: { lat: 48.8566, lon: 2.3522, label: 'Paris' },
    expectedKm: 343,
  },
  {
    id: 'mumbai_bengaluru',
    name: 'Mumbai ➔ Bengaluru',
    category: 'Major Metros',
    description: 'India tech corridor across the Deccan Plateau',
    p1: { lat: 19.0760, lon: 72.8777, label: 'Mumbai' },
    p2: { lat: 12.9716, lon: 77.5946, label: 'Bengaluru' },
    expectedKm: 844,
  },
  {
    id: 'tokyo_sydney',
    name: 'Tokyo ➔ Sydney',
    category: 'Aviation & Sea',
    description: 'North-South Pacific crossing across the Equator',
    p1: { lat: 35.6762, lon: 139.6503, label: 'Tokyo' },
    p2: { lat: -33.8688, lon: 151.2093, label: 'Sydney' },
    expectedKm: 7823,
  },
  {
    id: 'warehouse_geofence_500m',
    name: 'Fleet Geofence Test (500m Radius)',
    category: 'Geofence Tests',
    description: 'Distribution hub vs delivery vehicle approaching entrance gate',
    p1: { lat: 37.77490, lon: -122.41940, label: 'Logistics Warehouse' },
    p2: { lat: 37.77780, lon: -122.41620, label: 'Delivery Truck #402' },
    expectedKm: 0.43,
  },
  {
    id: 'airport_perimeter_5km',
    name: 'Airport Proximity Alert (5 km)',
    category: 'Geofence Tests',
    description: 'Restricted flight zone perimeter verification',
    p1: { lat: 51.4700, lon: -0.4543, label: 'Airport Tower' },
    p2: { lat: 51.5020, lon: -0.4120, label: 'Drone Sensor Station' },
    expectedKm: 4.62,
  },
  {
    id: 'north_south_pole',
    name: 'North Pole ➔ South Pole',
    category: 'Extreme Antipodes',
    description: 'Exact polar hemisphere traversal through the meridian (20,004 km)',
    p1: { lat: 90.0000, lon: 0.0000, label: 'North Pole' },
    p2: { lat: -90.0000, lon: 0.0000, label: 'South Pole' },
    expectedKm: 20004,
  },
];
