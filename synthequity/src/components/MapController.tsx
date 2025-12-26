import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { CityConfig, SyntheticBlock, Clinic, Coordinate, FacilityType } from '../types';

// Icons
// Blue = Clinic / Base
const iconBlueSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
  <circle cx="12" cy="10" r="3"></circle>
</svg>
`;
const mobileIcon = new L.DivIcon({
  html: iconBlueSvg,
  className: 'bg-transparent',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Red = Telehealth Kiosk
const iconRedSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
  <rect x="9" y="8" width="6" height="4" rx="1"></rect>
</svg>
`;
const kioskIcon = new L.DivIcon({
  html: iconRedSvg,
  className: 'bg-transparent',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});


interface MapControllerProps {
  city: CityConfig;
  blocks: SyntheticBlock[];
  clinics: Clinic[];
  onAddClinic: (coord: Coordinate, type: FacilityType) => void;
  onRemoveClinic: (id: string) => void;
}

// Component to handle map clicks
const MapEvents: React.FC<{ onMapClick: (c: Coordinate) => void }> = ({ onMapClick }) => {
  const onMapClickRef = useRef(onMapClick);
   
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useMapEvents({
    click(e) {
      if (e.latlng && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

// Component to handle view changes when city changes
const MapViewUpdater: React.FC<{ center: Coordinate, zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.flyTo([center.lat, center.lng], zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
};

// Helper component to fix layout issues when the map container resizes or loads
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
       map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Helper for Color Scale (Green -> Yellow -> Orange -> Red)
const getDisparityColor = (score: number) => {
  // Score 0-100
  if (score < 20) return '#4ade80'; // Green-400
  if (score < 40) return '#a3e635'; // Lime-400
  if (score < 60) return '#facc15'; // Yellow-400
  if (score < 80) return '#fb923c'; // Orange-400
  return '#ef4444'; // Red-500
};

const MapController: React.FC<MapControllerProps> = ({ 
  city, 
  blocks, 
  clinics, 
  onAddClinic, 
  onRemoveClinic 
}) => {
  const [pendingLocation, setPendingLocation] = useState<Coordinate | null>(null);
  
  // RESPONSIVENESS FIX: Detect mobile width
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom Logic: On mobile, zoom out by 1 level
  const zoomLevel = isMobile ? city.zoom - 1 : city.zoom;

  // Guard: If city or coordinates are missing/invalid
  if (!city || !city.center || isNaN(city.center.lat) || isNaN(city.center.lng)) {
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
        Initializing Map...
      </div>
    );
  }

  const handleSelection = (e: React.MouseEvent, type: FacilityType) => {
    e.stopPropagation();
    if (pendingLocation) {
      onAddClinic(pendingLocation, type);
      setPendingLocation(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full relative z-0">
      <MapContainer 
        center={[city.center.lat, city.center.lng]} 
        zoom={zoomLevel} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapResizer />
        <MapViewUpdater center={city.center} zoom={zoomLevel} />
        <MapEvents onMapClick={setPendingLocation} />

        {/* Pending Location Selection Menu */}
        {pendingLocation && (
          <Popup 
            position={[pendingLocation.lat, pendingLocation.lng]}
            eventHandlers={{
              remove: () => setPendingLocation(null)
            }}
          >
            <div className="flex flex-col gap-2 p-1 text-center min-w-[140px]">
              <span className="text-xs font-semibold text-slate-500 mb-1">Deploy Resource</span>
              <button 
                onClick={(e) => handleSelection(e, 'CLINIC')}
                className="bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                Add Clinic
              </button>
              <button 
                onClick={(e) => handleSelection(e, 'KIOSK')}
                className="bg-red-500 text-white text-xs px-3 py-2 rounded hover:bg-red-600 transition-colors shadow-sm"
              >
                Add Telehealth Kiosk
              </button>
            </div>
          </Popup>
        )}

        {/* Render Synthetic Population (Heatmap Layers) */}
        {blocks.map((block) => {
           if (!block.location || isNaN(block.location.lat) || isNaN(block.location.lng)) return null;
           
           return (
            <CircleMarker
              key={`${block.id}-${block.disparityScore.toFixed(2)}`}
              center={[block.location.lat, block.location.lng]}
              radius={6}
              pathOptions={{
                fillColor: getDisparityColor(block.disparityScore),
                fillOpacity: 0.6,
                color: 'transparent', 
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="block text-slate-700 mb-1">Census Block {block.id}</strong>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-500">
                    <span>Pop:</span> <span className="font-mono text-slate-800">{block.population}</span>
                    <span>Avg Inc:</span> <span className="font-mono text-slate-800">${(block.avgIncome / 1000).toFixed(1)}k</span>
                    <span>Transit:</span> <span className="font-mono text-slate-800">{block.transitScore.toFixed(2)}</span>
                    <span>Nearest Resource:</span> <span className="font-mono text-slate-800">{block.distanceToNearestClinic.toFixed(1)}km</span>
                    <div className="col-span-2 mt-1 pt-1 border-t border-slate-200">
                      <span>Disparity Score: </span>
                      <span className={`font-bold ${block.disparityScore > 60 ? 'text-red-600' : 'text-green-600'}`}>
                        {block.disparityScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Clinics */}
        {clinics.map((clinic) => {
          if (!clinic.location || isNaN(clinic.location.lat) || isNaN(clinic.location.lng)) return null;
          
          const icon = clinic.type === 'KIOSK' ? kioskIcon : mobileIcon;

          return (
            <Marker
              key={clinic.id}
              position={[clinic.location.lat, clinic.location.lng]}
              icon={icon}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  e.originalEvent.preventDefault();
                  
                  // UPDATED: No more check for isExisting. All clinics can be removed.
                  onRemoveClinic(clinic.id);
                }
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">
                  {clinic.type === 'BASE' && "Existing Hospital"}
                  {clinic.type === 'CLINIC' && "Clinic"}
                  {clinic.type === 'KIOSK' && "Telehealth Kiosk"}
                  <br />
                  <span className="text-xs font-normal text-slate-500">
                    {/* UPDATED: Unified instruction text */}
                    Click marker to remove
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapController;