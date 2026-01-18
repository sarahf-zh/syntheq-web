import type { CityConfig, Clinic, SyntheticBlock, SimulationStats, FacilityType } from '../types';
import { MODEL_CONFIG } from '../model/trainedModelConfig';

// Constants for the Risk Model
const MAX_CONSIDERED_DISTANCE_KM = 8; 

// Capability Weights
const EFFICIENCY_CLINIC = 1.0;
// FIX: Lowered to 0.4 to ensure Kiosks have a distinct, smaller impact than Clinics
const EFFICIENCY_KIOSK = 0.4; 
const EFFICIENCY_BASE = 1.0;

// --- UTILITY: Deterministic RNG (Seeded Random) ---
class SeededRNG {
  private state: number;

  constructor(seedString: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seedString.length; i++) {
      h ^= seedString.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.state = h >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// --- GEOMETRY HELPER: Ray-Casting Algorithm ---
function isPointInPolygon(point: {lat: number, lng: number}, vs: number[][]) {
  const x = point.lat, y = point.lng;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// EXTENDED CONFIGURATION INTERFACE
interface ExtendedCityConfig extends CityConfig {
  distributionFactor?: number; 
  disparityIntensity?: number; 
}

export const CITIES: ExtendedCityConfig[] = [
  {
    name: "San Francisco, CA",
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 12,
    populationScale: 0.8,
    existingClinicsCount: 8,
    // TARGET: 65% Coverage
    distributionFactor: 0.45, 
    disparityIntensity: 1.0,
    polygon: [
      [37.8120, -122.4780], [37.8080, -122.4150], [37.7950, -122.3900], 
      [37.7770, -122.3850], [37.7500, -122.3700], [37.7100, -122.3800], 
      [37.7050, -122.4150], [37.7050, -122.4750], [37.7050, -122.5120], 
      [37.7250, -122.5100], [37.7750, -122.5150], [37.7880, -122.4950]
    ]
  },
  {
    name: "Seattle, WA",
    center: { lat: 47.6062, lng: -122.3321 },
    zoom: 11,
    populationScale: 0.9,
    existingClinicsCount: 11,
    // TARGET: Low 70s% Coverage, LOTS of red dots
    distributionFactor: 0.75,
    disparityIntensity: 1.8, 
    polygon: [
      [47.7340, -122.3750], [47.7340, -122.2800], [47.6500, -122.2700], 
      [47.5800, -122.2800], [47.5100, -122.2400], [47.5000, -122.3000], 
      [47.5100, -122.3900], [47.5800, -122.4400], [47.5900, -122.3500], 
      [47.6400, -122.4000], [47.6900, -122.4000]
    ]
  },
  {
    name: "Washington, D.C.",
    center: { lat: 38.9072, lng: -77.0369 },
    zoom: 12,
    populationScale: 1.0,
    // TARGET: <70% Coverage, Mix of Green/Orange/Red
    existingClinicsCount: 10, 
    distributionFactor: 1.0,
    disparityIntensity: 1.2,
    polygon: [
      [38.9950, -77.0400], [38.9300, -76.9100], [38.8900, -76.9100], 
      [38.8000, -77.0300], [38.8300, -77.0500], [38.8900, -77.0700], 
      [38.9300, -77.1200]
    ]
  },
  {
    name: "Jersey City, NJ",
    center: { lat: 40.7178, lng: -74.0431 },
    zoom: 13,
    populationScale: 1.2,
    existingClinicsCount: 7,
    // TARGET: ~74% Coverage
    distributionFactor: 0.65,
    disparityIntensity: 1.3,
    polygon: [
      [40.7650, -74.0600], [40.7450, -74.0200], [40.7150, -74.0300], 
      [40.7000, -74.0400], [40.6900, -74.0600], [40.6600, -74.1000], 
      [40.7000, -74.1200], [40.7400, -74.0800]
    ]
  },
  {
    name: "Houston, TX",
    center: { lat: 29.7604, lng: -95.3698 },
    zoom: 10, 
    populationScale: 1.1,
    // TARGET: ~30% Coverage
    existingClinicsCount: 30, 
    distributionFactor: 2.5,
    disparityIntensity: 0.2,
    polygon: [
      [29.8500, -95.5500], [29.8800, -95.3500], [29.8500, -95.2500], 
      [29.7500, -95.2000], [29.6500, -95.2500], [29.6000, -95.4000], 
      [29.6500, -95.5000], [29.7200, -95.6000]
    ]
  },
  {
    name: "Austin, TX",
    center: { lat: 30.2672, lng: -97.7431 },
    zoom: 11,
    populationScale: 0.9,
    // TARGET: ~30% Coverage
    existingClinicsCount: 8,
    distributionFactor: 1.5,
    disparityIntensity: 0.3,
    polygon: [
      [30.4500, -97.7500], [30.4200, -97.6800], [30.3500, -97.6500], 
      [30.2900, -97.6000], [30.2200, -97.6500], [30.1800, -97.7000], 
      [30.1500, -97.7800], [30.1800, -97.8500], [30.2300, -97.8800], 
      [30.3000, -97.8000], [30.3700, -97.7800]
    ]
  },
  {
    name: "Phoenix, AZ",
    center: { lat: 33.4484, lng: -112.0740 },
    zoom: 11,
    populationScale: 1.0,
    // TARGET: ~20% Coverage
    existingClinicsCount: 9,
    distributionFactor: 2.5,
    disparityIntensity: 0.6,
    polygon: [
      [33.6800, -112.1500], [33.6800, -111.9500], [33.5800, -111.9500], 
      [33.5000, -111.9800], [33.4200, -111.9800], [33.3200, -111.9800], 
      [33.3200, -112.1500], [33.4200, -112.2500], [33.5500, -112.2500], 
      [33.6200, -112.1800]
    ]
  },
  {
    name: "Chicago, IL",
    center: { lat: 41.8781, lng: -87.6298 },
    zoom: 11,
    populationScale: 1.2,
    existingClinicsCount: 12, 
    // TARGET: ~50% Coverage
    distributionFactor: 1.5,
    // TARGET: Increased Orange/Red dots
    disparityIntensity: 1.6,
    polygon: [
      [42.0200, -87.6600], [42.0200, -87.8000], [41.9000, -87.7500], 
      [41.8000, -87.7200], [41.7000, -87.7000], [41.6500, -87.6000], 
      [41.7300, -87.5200], [41.8000, -87.5800], [41.8900, -87.6000]
    ]
  },
  {
    name: "Boston, MA",
    center: { lat: 42.3601, lng: -71.0589 },
    zoom: 12,
    populationScale: 1.1,
    existingClinicsCount: 10,
    distributionFactor: 1.0,
    disparityIntensity: 1.0,
    polygon: [
      [42.3950, -71.0100], [42.3700, -71.0300], [42.3500, -71.0400], 
      [42.3300, -71.0200], [42.2800, -71.0500], [42.2400, -71.1200], 
      [42.2600, -71.1500], [42.2900, -71.1700], [42.3500, -71.1600], 
      [42.3600, -71.1200], [42.3500, -71.0900], [42.3650, -71.0600], 
      [42.3750, -71.0550]
    ]
  },
  {
    name: "Baltimore, MD",
    center: { lat: 39.2904, lng: -76.6122 },
    zoom: 12,
    populationScale: 1.0,
    existingClinicsCount: 6,
    distributionFactor: 1.0,
    disparityIntensity: 1.0,
    polygon: [
      [39.3700, -76.7100], [39.3700, -76.5300], [39.2800, -76.5300], 
      [39.2600, -76.5600], [39.2200, -76.5500], [39.2000, -76.6000], 
      [39.2500, -76.6500], [39.2800, -76.7100]
    ]
  }
];

// Helper: Haversine distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
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

// Procedural Generation of Synthetic Population
export const generateSyntheticPopulation = (city: ExtendedCityConfig): SyntheticBlock[] => {
  if (!city || !city.center) return [];

  const rng = new SeededRNG(city.name);
  const blocks: SyntheticBlock[] = [];
  const gridSize = 40; 
  const safeZoom = typeof city.zoom === 'number' ? city.zoom : 12;
  const zoomDiff = 12 - safeZoom;
  const spread = 0.15 * Math.pow(2, zoomDiff);

  const seeds = [
    { type: 'WEALTH', lat: city.center.lat + (spread * 0.3), lng: city.center.lng - (spread * 0.2), strength: 0.9 },
    { type: 'POVERTY', lat: city.center.lat - (spread * 0.25), lng: city.center.lng + (spread * 0.25), strength: 0.9 },
    { type: 'TRANSIT_HUB', lat: city.center.lat, lng: city.center.lng, strength: 1.0 }, 
    { type: 'TRANSIT_DESERT', lat: city.center.lat + (spread * 0.4), lng: city.center.lng + (spread * 0.4), strength: 0.8 },
  ];
  
  // Intensity Scale (Defaults to 1.0 if not set)
  const intensity = city.disparityIntensity || 1.0;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const xOffset = (i / gridSize - 0.5) * (spread * 2.0);
      const yOffset = (j / gridSize - 0.5) * (spread * 2.0);

      const lat = city.center.lat + xOffset;
      const lng = city.center.lng + yOffset;

      if (city.polygon && city.polygon.length > 0) {
        if (!isPointInPolygon({ lat, lng }, city.polygon)) {
            continue; 
        }
      }

      let income = 45000 + (rng.next() * 30000);
      let transit = 0.3 + (rng.next() * 0.3);
      let population = 100 + (rng.next() * 300);

      seeds.forEach(seed => {
        const dist = Math.sqrt(Math.pow(lat - seed.lat, 2) + Math.pow(lng - seed.lng, 2));
        const influence = Math.max(0, 1 - (dist / spread * 2.5)); 

        if (influence > 0) {
            if (seed.type === 'WEALTH') {
                income += (120000 * influence * seed.strength);
                population -= (100 * influence); 
            }
            if (seed.type === 'POVERTY') {
                // APPLY INTENSITY FACTOR
                income -= ((40000 * intensity) * influence * seed.strength);
                population += (300 * influence); 
            }
            if (seed.type === 'TRANSIT_HUB') {
                transit += (0.6 * influence * seed.strength);
            }
            if (seed.type === 'TRANSIT_DESERT') {
                transit -= ((0.4 * intensity) * influence * seed.strength);
            }
        }
      });

      const avgIncome = Math.max(15000, Math.min(250000, income));
      const transitScore = Math.max(0, Math.min(1, transit));
      const finalPop = Math.floor(Math.max(50, population) * city.populationScale);

      blocks.push({
        id: `block-${i}-${j}`,
        location: { lat, lng },
        population: finalPop,
        avgIncome,
        transitScore,
        distanceToNearestClinic: 999, 
        disparityScore: 0 
      });
    }
  }
  return blocks;
};

// Initial existing clinics
export const generateInitialClinics = (city: ExtendedCityConfig): Clinic[] => {
  if (!city || !city.center) return [];

  const rng = new SeededRNG(city.name);
  const clinics: Clinic[] = [];
  const count = city.existingClinicsCount;
  
  const safeZoom = typeof city.zoom === 'number' ? city.zoom : 12;
  const zoomDiff = 12 - safeZoom;
  
  const distFactor = city.distributionFactor || 1.0;
  const spread = (0.07 * distFactor) * Math.pow(2, zoomDiff);
  
  let attempts = 0;
  while (clinics.length < count && attempts < 500) {
    attempts++;
    let lat = city.center.lat + (rng.next() - 0.5) * spread * 2;
    let lng = city.center.lng + (rng.next() - 0.5) * spread * 2;

    if (city.polygon && !isPointInPolygon({ lat, lng }, city.polygon)) {
        continue;
    }

    clinics.push({
      id: `existing-${clinics.length}`,
      location: { lat, lng },
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

// Risk Model
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
      // FIX: Store effective distance for coverage calculation
      effectiveDistance: minEffectiveDistance, 
      disparityScore: Math.min(100, Math.max(0, rawScore * 100))
    } as SyntheticBlock;
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
  
  // FIX: Use Effective Distance for coverage check
  const coveredPopulation = blocks
    .filter(b => (b as any).effectiveDistance < 3) 
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