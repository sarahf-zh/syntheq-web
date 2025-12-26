import type { CityConfig, Clinic, SyntheticBlock, SimulationStats, FacilityType } from '../types';
import { MODEL_CONFIG } from '../model/trainedModelConfig';

// Constants for the Risk Model
const MAX_CONSIDERED_DISTANCE_KM = 8; 


// Capability Weights
const EFFICIENCY_CLINIC = 1.0;
const EFFICIENCY_KIOSK = 0.6; 
const EFFICIENCY_BASE = 1.0;

export const CITIES: CityConfig[] = [
  {
    name: "San Francisco, CA",
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 12,
    populationScale: 0.8,
    existingClinicsCount: 8
  },
  {
    name: "Austin, TX",
    center: { lat: 30.2672, lng: -97.7431 },
    zoom: 12,
    populationScale: 0.9,
    existingClinicsCount: 4
  },
  {
    name: "Boston, MA",
    center: { lat: 42.3601, lng: -71.0589 },
    zoom: 12,
    populationScale: 1.1,
    existingClinicsCount: 10
  },
  {
    name: "Baltimore, MD",
    center: { lat: 39.2904, lng: -76.6122 },
    zoom: 12,
    populationScale: 1.0,
    existingClinicsCount: 6
  },
  {
    name: "Jersey City, NJ",
    center: { lat: 40.7178, lng: -74.0431 },
    zoom: 13,
    populationScale: 1.2,
    existingClinicsCount: 7
  },
  {
    name: "Phoenix, AZ",
    center: { lat: 33.4484, lng: -112.0740 },
    zoom: 11,
    populationScale: 1.0,
    existingClinicsCount: 5
  }
];

// Helper: Haversine distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Procedural Generation of Synthetic Population (mimicking CTGAN output)
export const generateSyntheticPopulation = (city: CityConfig): SyntheticBlock[] => {
  if (!city || !city.center) return [];

  const blocks: SyntheticBlock[] = [];
  
  // PERFORMANCE FIX: 24x24 grid (576 nodes) is the sweet spot for mobile performance.
  const gridSize = 24; 
  
  // Dynamic spread based on zoom
  const safeZoom = typeof city.zoom === 'number' ? city.zoom : 12;
  const zoomDiff = 12 - safeZoom;
  const spread = 0.15 * Math.pow(2, zoomDiff);

  // REALISM FIX: "Neighborhood Seeds" Logic
  // Instead of a smooth radial gradient, we place invisible "seeds" that influence nearby blocks.
  // This creates messy, realistic clusters of inequality (e.g. a rich area next to a poor transit desert).
  const seeds = [
    { type: 'WEALTH', lat: city.center.lat + (spread * 0.3), lng: city.center.lng - (spread * 0.2), strength: 0.9 },
    { type: 'POVERTY', lat: city.center.lat - (spread * 0.2), lng: city.center.lng + (spread * 0.2), strength: 0.9 },
    { type: 'TRANSIT_HUB', lat: city.center.lat, lng: city.center.lng, strength: 1.0 }, // Downtown
    { type: 'TRANSIT_DESERT', lat: city.center.lat + (spread * 0.4), lng: city.center.lng + (spread * 0.4), strength: 0.8 },
  ];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const xOffset = (i / gridSize - 0.5) * spread;
      const yOffset = (j / gridSize - 0.5) * spread;

      const lat = city.center.lat + xOffset;
      const lng = city.center.lng + yOffset;

      // 1. Establish Baseline (noisy random)
      let income = 45000 + (Math.random() * 30000);
      let transit = 0.3 + (Math.random() * 0.3);
      let population = 100 + (Math.random() * 300);

      // 2. Apply Seed Influence
      seeds.forEach(seed => {
        // Distance from this block to the seed
        const dist = Math.sqrt(Math.pow(lat - seed.lat, 2) + Math.pow(lng - seed.lng, 2));
        // Normalize distance influence (closer = stronger)
        // Multiplier 4.0 tunes how "tight" the neighborhoods are
        const influence = Math.max(0, 1 - (dist / spread * 3.5)); 

        if (influence > 0) {
            if (seed.type === 'WEALTH') {
                income += (120000 * influence * seed.strength);
                population -= (100 * influence); // Wealthy areas often less dense
            }
            if (seed.type === 'POVERTY') {
                income -= (25000 * influence * seed.strength);
                population += (300 * influence); // Higher density
            }
            if (seed.type === 'TRANSIT_HUB') {
                transit += (0.6 * influence * seed.strength);
            }
            if (seed.type === 'TRANSIT_DESERT') {
                transit -= (0.4 * influence * seed.strength);
            }
        }
      });

      // 3. Clamp final values to realistic bounds
      const avgIncome = Math.max(15000, Math.min(250000, income));
      const transitScore = Math.max(0, Math.min(1, transit));
      const finalPop = Math.floor(Math.max(50, population) * city.populationScale);

      blocks.push({
        id: `block-${i}-${j}`,
        location: { lat, lng },
        population: finalPop,
        avgIncome,
        transitScore,
        distanceToNearestClinic: 999, // placeholder, calculated later
        disparityScore: 0 // placeholder, calculated later
      });
    }
  }
  return blocks;
};

// Initial existing clinics based on city density
export const generateInitialClinics = (city: CityConfig): Clinic[] => {
  if (!city || !city.center) return [];

  const clinics: Clinic[] = [];
  const count = city.existingClinicsCount;
  
  const safeZoom = typeof city.zoom === 'number' ? city.zoom : 12;
  const zoomDiff = 12 - safeZoom;
  const spread = 0.08 * Math.pow(2, zoomDiff);
  
  for (let i = 0; i < count; i++) {
    clinics.push({
      id: `existing-${i}`,
      location: {
        lat: city.center.lat + (Math.random() - 0.5) * spread,
        lng: city.center.lng + (Math.random() - 0.5) * spread
      },
      type: 'BASE',
      isExisting: true
    });
  }
  return clinics;
};

const getEfficiencyFactor = (type: FacilityType) => {
  switch (type) {
    case 'CLINIC': return EFFICIENCY_CLINIC;
    case 'KIOSK': return EFFICIENCY_KIOSK;
    default: return EFFICIENCY_BASE;
  }
};

// The Core Risk Model
export const calculateDisparityScores = (blocks: SyntheticBlock[], clinics: Clinic[]): SyntheticBlock[] => {
  return blocks.map(block => {
    let minEffectiveDistance = 9999;
    let actualPhysicalDistanceToNearest = 9999;

    clinics.forEach(clinic => {
      const dist = getDistanceFromLatLonInKm(
        block.location.lat, 
        block.location.lng, 
        clinic.location.lat, 
        clinic.location.lng
      );
      
      const efficiency = getEfficiencyFactor(clinic.type);
      const effectiveDist = dist / efficiency;

      if (effectiveDist < minEffectiveDistance) minEffectiveDistance = effectiveDist;
      if (dist < actualPhysicalDistanceToNearest) actualPhysicalDistanceToNearest = dist;
    });

    const incomeVulnerability = 1 - (Math.min(block.avgIncome, 100000) / 100000);
    const transitVulnerability = 1 - block.transitScore;
    const distanceVulnerability = Math.min(minEffectiveDistance, MAX_CONSIDERED_DISTANCE_KM) / MAX_CONSIDERED_DISTANCE_KM;


    const rawScore = (
      (incomeVulnerability * MODEL_CONFIG.weights.INCOME) +
      (transitVulnerability * MODEL_CONFIG.weights.TRANSIT) +
      (distanceVulnerability * MODEL_CONFIG.weights.DISTANCE) + 
      MODEL_CONFIG.intercept
    );

    return {
      ...block,
      distanceToNearestClinic: actualPhysicalDistanceToNearest,
      disparityScore: Math.min(100, Math.max(0, rawScore * 100))
    };
  });
};

export const getStats = (blocks: SyntheticBlock[], clinics: Clinic[]): SimulationStats => {
  if (blocks.length === 0) return { 
    averageDisparity: 0, 
    maxDisparity: 0, 
    coveragePercentage: 0, 
    totalFacilities: 0,
    clinicCount: 0,
    kioskCount: 0,
    baseCount: 0,
    totalPopulation: 0 
  };
  
  const totalPopulation = blocks.reduce((acc, b) => acc + b.population, 0);
  const weightedTotalDisparity = blocks.reduce((acc, b) => acc + (b.disparityScore * b.population), 0);
  const maxDisparity = Math.max(...blocks.map(b => b.disparityScore));
  
  const coveredPopulation = blocks
    .filter(b => b.distanceToNearestClinic < 3)
    .reduce((acc, b) => acc + b.population, 0);

  const clinicCount = clinics.filter(c => c.type === 'CLINIC').length;
  const kioskCount = clinics.filter(c => c.type === 'KIOSK').length;
  const baseCount = clinics.filter(c => c.type === 'BASE').length;

  return {
    averageDisparity: totalPopulation > 0 ? weightedTotalDisparity / totalPopulation : 0,
    maxDisparity,
    coveragePercentage: totalPopulation > 0 ? (coveredPopulation / totalPopulation) * 100 : 0,
    totalFacilities: clinics.length,
    clinicCount,
    kioskCount,
    baseCount,
    totalPopulation
  };
};