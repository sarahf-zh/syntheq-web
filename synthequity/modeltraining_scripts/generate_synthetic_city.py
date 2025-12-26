import pandas as pd
import numpy as np
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata

# ==========================================
# PHASE 1: CREATE THE "PROXY" REAL DATA
# In a real hospital implementation, this step is skipped 
# and you would load actual patient CSVs.
# ==========================================
print("1. Generating Proxy 'Real' Data...")

def generate_proxy_data(num_samples=2000):
    # We create a dataset that has "hidden" logic for the AI to discover
    
    # 1. Income (Normal distribution centered at 60k)
    income = np.random.normal(60000, 25000, num_samples)
    income = np.clip(income, 15000, 200000) # Clamp values
    
    # 2. Transit Score (0.0 to 1.0)
    # Correlation: Richer people often live in suburbs with LOWER transit scores
    transit = np.random.beta(2, 2, num_samples)
    transit = transit - (income / 500000) # Add negative correlation
    transit = np.clip(transit, 0, 1)

    # 3. Distance to Care (0 to 15km)
    distance = np.random.exponential(3, num_samples) 
    
    # 4. The "Health Disparity Score" (The outcome)
    # This is the "Ground Truth" formula the AI must learn
    # High Income = Low Risk
    # High Transit = Low Risk
    # High Distance = High Risk
    risk_score = (
        (1 - (income/150000)) * 0.3 + 
        (1 - transit) * 0.2 + 
        (distance/10) * 0.5
    )
    # Add some random noise because real life is messy
    risk_score += np.random.normal(0, 0.05, num_samples)
    risk_score = np.clip(risk_score, 0, 1) * 100

    return pd.DataFrame({
        'income_norm': income,
        'transit_score': transit,
        'distance_km': distance,
        'health_disparity_score': risk_score
    })

real_data = generate_proxy_data()
print(f"   Created {len(real_data)} rows of proxy data.")

# ==========================================
# PHASE 2: TRAIN THE CTGAN MODEL
# ==========================================
print("\n2. Initializing CTGAN...")

# 1. Detect Metadata (Tells CTGAN which columns are numbers, categories, etc.)
metadata = SingleTableMetadata()
metadata.detect_from_dataframe(real_data)

# 2. Create the Synthesizer
synthesizer = CTGANSynthesizer(
    metadata,
    epochs=100, # Number of training cycles (higher = better accuracy, slower)
    verbose=True
)

# 3. Train! (This is the heavy lifting)
print("   Training started (this may take a minute)...")
synthesizer.fit(real_data)
print("   Training complete.")

# ==========================================
# PHASE 3: GENERATE & SAVE SYNTHETIC DATA
# ==========================================
print("\n3. Generating Synthetic Data...")

# Generate 5,000 new "fake" people based on the learned patterns
synthetic_data = synthesizer.sample(num_rows=5000)

# Save to CSV (This is the file you load in the Regression Step!)
synthetic_data.to_csv("synthetic_city_data.csv", index=False)
print("   Saved 'synthetic_city_data.csv'")

# Save the Model itself (optional, if you want to reuse it later)
synthesizer.save("synth_equity_ctgan.pkl")
print("   Saved CTGAN model to 'synth_equity_ctgan.pkl'")

print("\nDONE! You can now use 'synthetic_city_data.csv' to train your Regression Model.")