# 🚀 SynthEquity: Computational Epidemiology Framework

SynthEquity is a AI-based simulation tool designed to optimize healthcare access and identify "medical deserts." It utilizes a **synthetic population model** generated via Generative AI and a **multivariate regression model** running via real-time inference to visualize health disparities without compromising individual privacy. This allows policymakers to simulate interventions (placing new clinics) and measure their impact instantly.

<div align="center">
  <img src="/images/synthequity1.png" alt="SynthEquity Main UI" width="400">
</div>

## 📖 Rationale

Public health resources are often allocated based on lagging, aggregate data. Precise, hyper-local modeling is difficult due to strict privacy laws (HIPAA). SynthEquity bridges this gap by using **Generative AI** to create a statistically accurate "synthetic city."

The core architecture references a **Conditional Tabular GAN (CTGAN)** to model complex demographic correlations and a **Multivariate Regression Model** to quantify risk. This allows the system to simulate hyper-local health determinants at the block level while ensuring no real individual's data is exposed.

## ✨ Key Features

* **Synthetic Population Generation:** Simulates realistic census block groups with varying attributes (Population, Average Income, Transit Score) based on real-world geographic constraints.
* **Interactive Simulation:**
    * **Base Map:** Real geographic tiles (OpenStreetMap) for cities like Phoenix, San Francisco, Austin, Boston, Baltimore, and Jersey City.
    * **Intervention:** Users can click to **deploy new healthcare facilities (clinic or telehealth kiosk)** or remove existing ones.
    * **Dynamic Heatmap:** Visualizes the "Health Access Disparity Score" in real-time.
* **Real-Time Risk Modeling:** Automatically recalculates risk scores and coverage metrics (e.g., % of population within 3km of care) whenever resources change.
* **AI Policy Analyst:** Integrated with **Google Gemini API** to generate executive summaries and epidemiological insights based on the current simulation state.

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Vite
* **Styling:** Tailwind CSS
* **Mapping:** Leaflet, React-Leaflet, OpenStreetMap
* **AI:** Google Gemini API (`@google/genai`)
* **Icons:** Lucide React

### Prerequisites
* Node.js (v18 or higher)
* A Google Gemini API Key

## 🧮 How It Works

### 1. Data Synthesis (CTGAN)
The application uses a **Conditional Tabular Generative Adversarial Network (CTGAN)** to generate a privacy-preserving "synthetic population." This model learns latent statistical distributions from urban demographic data to create realistic, yet artificial, population cohorts that mirror the complexity of a real city.

### 2. Real-Time Inference (Regression Model)
Health vulnerability is quantified using a **Multivariate Linear Regression model** implemented directly in the browser. By running this inference engine locally using vectorized JavaScript, the application can instantly calculate a **Disparity Score (0-100)** for every census block based on Income, Transit, and Distance variables without needing server-side processing.

### 3. AI Analysis
When the user requests a report, the app aggregates the simulation statistics (Average Risk, Coverage %) and sends them to the **Gemini API**. The LLM acts as a public health policy analyst, returning a qualitative assessment of the intervention's effectiveness.

## ⚠️ Disclaimer

This application is a **decision-support simulation**. The "people" on the map are synthetic entities generated for modeling purposes. While the geographic basemaps are real, the demographic data points are procedurally generated for this demonstration and should not be used for actual clinical navigation.

## 📄 License

MIT License