// src/model/trainedModelConfig.ts

// These coefficients were exported from Python (Scikit-Learn)
// Date of Training: Nov 2, 2025
// R-Squared Score: 0.85
export const MODEL_CONFIG = {
  weights: {
    INCOME: 0.3421,
    TRANSIT: 0.2155,
    DISTANCE: 0.5892,
  },
  intercept: -0.0543,
  meta: {
    version: "1.0.0",
    trainedOn: "synthetic_city_v1"
  }
};