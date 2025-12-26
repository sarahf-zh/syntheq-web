export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CityConfig {
  name: string;
  center: Coordinate;
  zoom: number;
  populationScale: number; // Density factor
  existingClinicsCount: number; // Number of initial clinics
}

// Represents a cluster of synthetic households (e.g., a Census Block Group)
export interface SyntheticBlock {
  id: string;
  location: Coordinate;
  population: number;
  avgIncome: number; // 0-100k normalized
  transitScore: number; // 0-1 (1 is perfect transit)
  
  // Dynamic scores calculated by the frontend model
  distanceToNearestClinic: number; // in km
  disparityScore: number; // 0-100 (100 is highest risk)
}

export type FacilityType = 'BASE' | 'CLINIC' | 'KIOSK';

export interface Clinic {
  id: string;
  location: Coordinate;
  type: FacilityType;
  isExisting: boolean; // True if part of base map, false if user added
}

export interface SimulationStats {
  averageDisparity: number;
  maxDisparity: number;
  coveragePercentage: number; // % of population within 2km of a clinic
  totalFacilities: number;
  clinicCount: number;
  kioskCount: number;
  baseCount: number;
  totalPopulation: number;
}