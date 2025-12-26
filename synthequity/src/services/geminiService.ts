import { GoogleGenAI } from "@google/genai";
import type { SimulationStats, CityConfig } from "../types";

// Safety check for API Key
const apiKey = process.env.API_KEY || '';

if (!apiKey) {
  console.warn("API_KEY is missing. Please check your .env file and vite.config.ts");
}

const ai = new GoogleGenAI({ apiKey });

export const analyzeSimulation = async (
  stats: SimulationStats, 
  city: CityConfig, 
  previousStats: SimulationStats | null
): Promise<string> => {
  
  const prompt = `
    You are a public health policy analyst for HealthCompass.
    
    Current Simulation Context:
    City: ${city.name}
    Total Synthetic Population: ${stats.totalPopulation.toLocaleString()}
    
    Resource Breakdown:
    - Total Healthcare Facilities: ${stats.totalFacilities}
    - Clinics / Hospitals: ${stats.clinicCount + stats.baseCount}
    - Telehealth Kiosks: ${stats.kioskCount}
    
    Current Metrics (Population Weighted):
    - Average Health Disparity Score (0-100): ${stats.averageDisparity.toFixed(1)}
    - Max Disparity Score: ${stats.maxDisparity.toFixed(1)}
    - Population Coverage (<3km to facility): ${stats.coveragePercentage.toFixed(1)}%

    ${previousStats ? `
    Previous Metrics (Before last intervention):
    - Previous Avg Disparity: ${previousStats.averageDisparity.toFixed(1)}
    - Previous Coverage: ${previousStats.coveragePercentage.toFixed(1)}%
    ` : 'No previous intervention data available.'}

    Task:
    Provide a concise (3-4 sentences) executive summary of the current health equity status.
    You MUST mention the breakdown of facility types (e.g. "With 22 total facilities, including 7 new kiosks...") and how this mix impacts the risk assessment.
    Note that Kiosks are less effective at reducing risk than full clinics.
    Use professional epidemiological tone. Focus on "medical deserts" and "health equity".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });
    
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Error", error);
    return "Unable to generate AI analysis at this time. Please check API configuration.";
  }
};