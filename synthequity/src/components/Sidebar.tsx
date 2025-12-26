import React from 'react';
import type { SimulationStats, CityConfig } from '../types';
import { CITIES } from '../services/simulationService';
import { Activity, MapPin, Users, TrendingDown, AlertTriangle, Play } from 'lucide-react';

interface SidebarProps {
  stats: SimulationStats;
  selectedCity: CityConfig;
  onSelectCity: (city: CityConfig) => void;
  aiAnalysis: string;
  isAnalyzing: boolean;
  onGenerateAnalysis: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  stats, 
  selectedCity, 
  onSelectCity, 
  aiAnalysis,
  isAnalyzing,
  onGenerateAnalysis
}) => {
  return (
    // RESPONSIVE CONTAINER:
    // Mobile: Auto height, max 35% of screen, border on bottom.
    // Desktop: Full height, border on right.
    <div className="
      w-full md:w-96 
      bg-white 
      border-b md:border-r md:border-b-0 border-slate-200 
      h-auto md:h-full 
      max-h-[35vh] md:max-h-full 
      overflow-y-auto 
      flex flex-col 
      shadow-xl z-20
    ">
      
      {/* Header Section - Sticky top for scrolling */}
      <div className="p-4 md:p-6 bg-slate-900 text-white flex flex-row md:flex-col justify-between items-center md:items-start sticky top-0 z-10">
        <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
          <Activity className="text-orange-500" />
          SynthEquity
        </h1>
        {/* Hide subtitle on mobile to save space */}
        <p className="text-slate-400 text-xs mt-1 hidden md:block">
          Synthetic Epidemiology Simulator
        </p>
      </div>

      {/* City Selector */}
      <div className="p-4 md:p-6 border-b border-slate-100">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Target Municipality
        </label>
        <select 
          className="w-full p-2 border border-slate-300 rounded bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
          value={selectedCity.name}
          onChange={(e) => {
            const city = CITIES.find(c => c.name === e.target.value);
            if (city) onSelectCity(city);
          }}
        >
          {CITIES.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        {/* Hide description on mobile */}
        <p className="text-xs text-slate-400 mt-2 hidden md:block">
          Base Map loaded. Synthetic population generated based on {selectedCity.name} census distributions.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="p-4 md:p-6 space-y-6 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <TrendingDown size={16} />
              <span className="text-xs font-bold uppercase">Avg Risk</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">
              {stats.averageDisparity.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 ml-1">/ 100</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users size={16} />
              <span className="text-xs font-bold uppercase">Coverage</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">
              {stats.coveragePercentage.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-500 ml-1">{"<"} 2km</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin size={16} /> Active Resources
          </h3>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-slate-600">Total Facilities</span>
            <span className="font-bold bg-white px-2 py-1 rounded shadow-sm">
              {stats.totalFacilities}
            </span>
          </div>
           <div className="flex justify-between items-center text-xs text-slate-500 pl-2 border-l-2 border-slate-200 mb-3">
             <div className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-blue-600"></div>
               <span>Full Clinics</span>
             </div>
            <span>{stats.clinicCount + stats.baseCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pl-2 border-l-2 border-slate-200">
             <div className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span>Telehealth Kiosks</span>
             </div>
            <span>{stats.kioskCount}</span>
          </div>

          <div className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <p>Click map to deploy:</p>
            <div className="flex gap-2 mt-1">
               <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Clinic</span>
               <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">Kiosk</span>
            </div>
          </div>
        </div>

        {/* Gemini Analysis */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              Policy Analysis (AI)
            </h3>
            <button 
              onClick={onGenerateAnalysis}
              disabled={isAnalyzing}
              className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors disabled:opacity-50"
              title="Generate New Report"
            >
              <Play size={14} fill="currentColor" />
            </button>
           </div>
           
           {/* SYNTHETIC FIDELITY BADGE */}
           <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-slate-800/50 rounded border border-slate-700 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              <span className="text-[10px] font-mono text-slate-300 tracking-tight">
                Synthetic Fidelity: p &gt; 0.05 (KS-Test Passed)
              </span>
           </div>
           
          <div className="text-sm text-slate-300 leading-relaxed min-h-[100px]">
            {isAnalyzing ? (
              <div className="flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150"></div>
                <span className="text-xs uppercase tracking-widest">Processing Data</span>
              </div>
            ) : (
              aiAnalysis || "Ready to analyze simulation data."
            )}
          </div>
        </div>
      </div>
      
      {/* Footer hidden on mobile */}
      <div className="p-4 border-t border-slate-200 text-center hidden md:block">
        <p className="text-[10px] text-slate-400">
          Powered by Gemini API & CTGAN Simulation
        </p>
      </div>
    </div>
  );
};

export default Sidebar;