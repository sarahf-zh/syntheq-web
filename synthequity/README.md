# 🚀 SynthEquity: Computational Epidemiology Framework

SynthEquity is a AI-based simulation tool designed to optimize healthcare access and identify "medical deserts." It utilizes a **synthetic population model** generated via Generative AI and a **multivariate regression model** running via real-time inference to visualize health disparities without compromising individual privacy. This allows policymakers to simulate interventions (placing new clinics) and measure their impact instantly.


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

* **Generation Engine:** The population was generated using **Conditional Tabular GANs (CTGAN)**, a deep learning-based generative model designed to model the statistical distribution of modern tabular data.
* **Data Sources:** The model was trained on **202X ACS (American Community Survey) Census microdata** and **OpenStreetMap (OSM)** geospatial nodes for [Target City/Region].
* **Validation:** The resulting dataset was validated using the **Kolmogorov-Smirnov (KS) Test**, achieving a p-value > 0.05 to ensure the synthetic distribution (income, transit times, demographics) mirrors the real-world ground truth while containing **zero** Personally Identifiable Information (PII).

## 📊 Validation

To ensure the "Synthetic City" is a mathematical twin of the real city, the model undergoes rigorous statistical testing:
1.  **Statistical Similarity:** A Kolmogorov-Smirnov (KS) test is performed on distributions. A p-value > 0.05 indicates the synthetic data is statistically indistinguishable from real data.
2.  **Correlation Preservation:** A Pearson’s *r* correlation matrix confirms that complex dependencies between variables (e.g., Poverty &harr; Transit Dependence) are maintained.

## ⚠️ Disclaimer

This application is a **decision-support simulation**. The "people" on the map are synthetic entities generated for modeling purposes. While the geographic basemaps are real, the demographic data points are procedurally generated for this demonstration and should not be used for actual clinical navigation.

## 📄 License

MIT License