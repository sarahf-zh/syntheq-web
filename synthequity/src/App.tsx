import { useState, useEffect, useCallback } from 'react';
import { 
  CITIES, 
  generateSyntheticPopulation, 
  generateInitialClinics, 
  calculateDisparityScores, 
  getStats 
} from './services/simulationService';
import { analyzeSimulation } from './services/geminiService';
import type { CityConfig, SyntheticBlock, Clinic, Coordinate, SimulationStats, FacilityType } from './types';
import Sidebar from './components/Sidebar';
import MapController from './components/MapController';

function App() {
  // State
  const [selectedCity, setSelectedCity] = useState<CityConfig>(CITIES[0]);
  const [blocks, setBlocks] = useState<SyntheticBlock[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<SimulationStats>({ 
    averageDisparity: 0, 
    maxDisparity: 0, 
    coveragePercentage: 0, 
    totalFacilities: 0,
    clinicCount: 0,
    kioskCount: 0,
    baseCount: 0,
    totalPopulation: 0
  });
  const [previousStats, setPreviousStats] = useState<SimulationStats | null>(null);
   
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Initialize City Data
  useEffect(() => {
    const initialBlocks = generateSyntheticPopulation(selectedCity);
    const initialClinics = generateInitialClinics(selectedCity);
    const calculatedBlocks = calculateDisparityScores(initialBlocks, initialClinics);
    
    setBlocks(calculatedBlocks);
    setClinics(initialClinics);
    setStats(getStats(calculatedBlocks, initialClinics));
    setPreviousStats(null); 
    setAiAnalysis(""); 
  }, [selectedCity]);

  // Handle adding a new clinic
  const handleAddClinic = useCallback((coord: Coordinate, type: FacilityType) => {
    const newClinic: Clinic = {
      id: `new-${Date.now()}`,
      location: coord,
      type: type,
      isExisting: false
    };
    
    const updatedClinics = [...clinics, newClinic];
    const updatedBlocks = calculateDisparityScores(blocks, updatedClinics);
    const newStats = getStats(updatedBlocks, updatedClinics);
    
    setPreviousStats(stats);
    setClinics(updatedClinics);
    setBlocks(updatedBlocks);
    setStats(newStats);
  }, [blocks, clinics, stats]);

  // Handle removing a clinic
  const handleRemoveClinic = useCallback((id: string) => {
    const updatedClinics = clinics.filter(c => c.id !== id);
    const updatedBlocks = calculateDisparityScores(blocks, updatedClinics);
    const newStats = getStats(updatedBlocks, updatedClinics);
    
    setPreviousStats(stats);
    setClinics(updatedClinics);
    setBlocks(updatedBlocks);
    setStats(newStats);
  }, [blocks, clinics, stats]);

  const handleGenerateReport = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSimulation(stats, selectedCity, previousStats);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const isDataReady = blocks.length > 0 && clinics.length > 0;

  return (
    // CRITICAL FIX: flex-col for mobile, md:flex-row for desktop. h-[100dvh] for mobile viewport.
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        stats={stats}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        aiAnalysis={aiAnalysis}
        isAnalyzing={isAnalyzing}
        onGenerateAnalysis={handleGenerateReport}
      />
      
      {/* Main container: Flex column + min-h-0 guarantees child map can shrink/grow properly */}
      <main className="flex-1 h-full relative flex flex-col min-h-0">
        {isDataReady ? (
           <MapController 
             city={selectedCity}
             blocks={blocks}
             clinics={clinics}
             onAddClinic={handleAddClinic}
             onRemoveClinic={handleRemoveClinic}
           />
        ) : (
           <div className="flex h-full items-center justify-center text-slate-400">
             Loading City Data...
           </div>
        )}
        
        {/* Interaction Hint Overlay: Repositioned for mobile (bottom) vs desktop (top-left) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:top-4 md:left-4 md:translate-x-0 md:bottom-auto z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md text-sm text-slate-600 border border-slate-200 pointer-events-none whitespace-nowrap">
           Click map to deploy resources
        </div>
      </main>
    </div>
  );
}

export default App;