import type { CityConfig, Clinic, SyntheticBlock, SimulationStats, FacilityType } from '../types';
import { MODEL_CONFIG } from '../model/trainedModelConfig';

// Constants for the Risk Model
const MAX_CONSIDERED_DISTANCE_KM = 8; 

// Capability Weights
const EFFICIENCY_CLINIC = 1.0;
const EFFICIENCY_KIOSK = 0.6; 
const EFFICIENCY_BASE = 1.0;

// --- GEOMETRY HELPER: Ray-Casting Algorithm ---
// Returns true if the point (lat, lng) is inside the polygon (array of [lat, lng])
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

export const CITIES: CityConfig[] = [
  {
    name: "San Francisco, CA",
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 12,
    populationScale: 0.8,
    existingClinicsCount: 8,
    // Detailed SF Boundary (Tracing the Peninsula)
    polygon: [
      [37.8110, -122.4770], // Golden Gate Bridge Base
      [37.8080, -122.4150], // Fisherman's Wharf
      [37.7950, -122.3900], // Ferry Building
      [37.7770, -122.3870], // Oracle Park area
      [37.7500, -122.3750], // Hunter's Point
      [37.7120, -122.3850], // Candlestick Point
      [37.7080, -122.4150], // Southern border (Geneva/Mission)
      [37.7080, -122.4750], // Southern border (near Daly City)
      [37.7080, -122.5100], // Lake Merced
      [37.7250, -122.5080], // Zoo
      [37.7750, -122.5120], // Ocean Beach
      [37.7850, -122.4950]  // Sea Cliff
    ]
  },
  {
    name: "Austin, TX",
    center: { lat: 30.2672, lng: -97.7431 },
    zoom: 11, // Zoomed out slightly for larger area
    populationScale: 0.9,
    existingClinicsCount: 4,
    // Detailed Austin Boundary (Central Core + irregularities)
    polygon: [
      [30.4500, -97.7500], // North: Arboretum
      [30.4200, -97.6800], // North East
      [30.3500, -97.6500], // East
      [30.2900, -97.6000], // Far East
      [30.2200, -97.6500], // Southeast (Airport area)
      [30.1800, -97.7000], // South East
      [30.1500, -97.7800], // South (Slaughter Ln)
      [30.1800, -97.8500], // South West
      [30.2300, -97.8800], // West (Barton Creek)
      [30.3000, -97.8000], // West (MoPac/2222)
      [30.3700, -97.7800]  // Northwest
    ]
  },
  {
    name: "Boston, MA",
    center: { lat: 42.3601, lng: -71.0589 },
    zoom: 12,
    populationScale: 1.1,
    existingClinicsCount: 10,
    // Detailed Boston Boundary (Harbor, Charles River)
    polygon: [
      [42.3950, -71.0100], // East Boston / Logan
      [42.3700, -71.0300], // Waterfront
      [42.3500, -71.0400], // Seaport
      [42.3300, -71.0200], // South Boston Point
      [42.2800, -71.0500], // Dorchester Bay
      [42.2400, -71.1200], // Hyde Park / Mattapan
      [42.2600, -71.1500], // Roslindale
      [42.2900, -71.1700], // West Roxbury
      [42.3500, -71.1600], // Brighton
      [42.3600, -71.1200], // Allston
      [42.3500, -71.0900], // Back Bay (Charles River side)
      [42.3650, -71.0600], // West End
      [42.3750, -71.0550]  // Charlestown
    ]
  },
  {
    name: "Baltimore, MD",
    center: { lat: 39.2904, lng: -76.6122 },
    zoom: 12,
    populationScale: 1.0,
    existingClinicsCount: 6,
    // Detailed Baltimore City (Independent City limits)
    polygon: [
      [39.3700, -76.7100], // Northwest corner
      [39.3700, -76.5300], // Northeast corner
      [39.2800, -76.5300], // Southeast (Canton/Industry)
      [39.2600, -76.5600], // Harbor entrance
      [39.2200, -76.5500], // Curtis Bay
      [39.2000, -76.6000], // South tip
      [39.2500, -76.6500], // Southwest
      [39.2800, -76.7100]  // West
    ]
  },
  {
    name: "Jersey City, NJ",
    center: { lat: 40.7178, lng: -74.0431 },
    zoom: 13,
    populationScale: 1.2,
    existingClinicsCount: 7,
    // Detailed Jersey City (Hudson waterfront)
    polygon: [
      [40.7650, -74.0600], // North (Heights)
      [40.7450, -74.0200], // Hoboken Border / Waterfront
      [40.7150, -74.0300], // Paulus Hook / Exchange Place
      [40.7000, -74.0400], // Liberty State Park North
      [40.6900, -74.0600], // LSP South
      [40.6600, -74.1000], // Greenville (South)
      [40.7000, -74.1200], // West Side (Hackensack River)
      [40.7400, -74.0800]  // Marion/Journal Square West
    ]
  },
  {
    name: "Phoenix, AZ",
    center: { lat: 33.4484, lng: -112.0740 },
    zoom: 11,
    populationScale: 1.0,
    existingClinicsCount: 5,
    // Detailed Phoenix (Core shape)
    polygon: [
      [33.6800, -112.1500], // Deer Valley
      [33.6800, -111.9500], // Scottsdale Border
      [33.5800, -111.9500], // Paradise Valley Border
      [33.5000, -111.9800], // Camelback area
      [33.4200, -111.9800], // Airport area
      [33.3200, -111.9800], // Ahwatukee
      [33.3200, -112.1500], // South Mountain West
      [33.4200, -112.2500], // West Phoenix
      [33.5500, -112.2500], // Glendale Border
      [33.6200, -112.1800]  // North West
    ]
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
  
  // High res grid to fill complex polygon shapes nicely
  const gridSize = 40; 
  
  // Dynamic spread based on zoom
  const safeZoom = typeof city.zoom === 'number' ? city.zoom : 12;
  const zoomDiff = 12 - safeZoom;
  const spread = 0.15 * Math.pow(2, zoomDiff);

  const seeds = [
    { type: 'WEALTH', lat: city.center.lat + (spread * 0.3), lng: city.center.lng - (spread * 0.2), strength: 0.9 },
    { type: 'POVERTY', lat: city.center.lat - (spread * 0.2), lng: city.center.lng + (spread * 0.2), strength: 0.9 },
    { type: 'TRANSIT_HUB', lat: city.center.lat, lng: city.center.lng, strength: 1.0 }, 
    { type: 'TRANSIT_DESERT', lat: city.center.lat + (spread * 0.4), lng: city.center.lng + (spread * 0.4), strength: 0.8 },
  ];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Over-scan the area (2.0x spread) to ensure we cover the corners of the polygon
      const xOffset = (i / gridSize - 0.5) * (spread * 2.0);
      const yOffset = (j / gridSize - 0.5) * (spread * 2.0);

      const lat = city.center.lat + xOffset;
      const lng = city.center.lng + yOffset;

      // --- POLYGON FILTER ---
      if (city.polygon && city.polygon.length > 0) {
        if (!isPointInPolygon({ lat, lng }, city.polygon)) {
            continue; 
        }
      }
      // ----------------------

      // 1. Establish Baseline
      let income = 45000 + (Math.random() * 30000);
      let transit = 0.3 + (Math.random() * 0.3);
      let population = 100 + (Math.random() * 300);

      // 2. Apply Seed Influence
      seeds.forEach(seed => {
        const dist = Math.sqrt(Math.pow(lat - seed.lat, 2) + Math.pow(lng - seed.lng, 2));
        const influence = Math.max(0, 1 - (dist / spread * 3.5)); 

        if (influence > 0) {
            if (seed.type === 'WEALTH') {
                income += (120000 * influence * seed.strength);
                population -= (100 * influence); 
            }
            if (seed.type === 'POVERTY') {
                income -= (25000 * influence * seed.strength);
                population += (300 * influence); 
            }
            if (seed.type === 'TRANSIT_HUB') {
                transit += (0.6 * influence * seed.strength);
            }
            if (seed.type === 'TRANSIT_DESERT') {
                transit -= (0.4 * influence * seed.strength);
            }
        }
      });

      // 3. Clamp final values
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
export const generateInitialClinics = (city: CityConfig): Clinic[] => {
  if (!city || !city.center) return [];

  const clinics: Clinic[] = [];
  const count = city.existingClinicsCount;
  
  const safeZoom = typeof city.zoom === 'number' ? city.zoom : 12;
  const zoomDiff = 12 - safeZoom;
  const spread = 0.08 * Math.pow(2, zoomDiff);
  
  let attempts = 0;
  while (clinics.length < count && attempts < 100) {
    attempts++;
    let lat = city.center.lat + (Math.random() - 0.5) * spread * 2;
    let lng = city.center.lng + (Math.random() - 0.5) * spread * 2;

    // Check if clinic is inside city
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