import pandas as pd
import numpy as np
from folktables import ACSDataSource, ACSIncome

# 1. Setup the downloader (Downloads 2018 Data for California)
print("Downloading Census Data for California (this takes 10-20 seconds)...")
data_source = ACSDataSource(survey_year='2018', horizon='1-Year', survey='person')
ca_data = data_source.get_data(states=["CA"], download=True)

# 2. Filter for San Francisco Only
# San Francisco is County Code '075'. 
# In PUMS data, SF is split into 7 "PUMA" zones: 07501 to 07507.
sf_data = ca_data[ca_data['PUMA'].isin([7501, 7502, 7503, 7504, 7505, 7506, 7507])].copy()

print(f"Filtered down to {len(sf_data)} real people in San Francisco.")

# 3. Select only the columns you need for HealthCompass
# PINCP = Total Income
# JWMNP = Travel Time to Work (Minutes) - A good proxy for transit access
# POVPIP = Income-to-Poverty Ratio (0 to 500)
# RAC1P = Race Code (useful for 'SynthEquity' validation)
columns_to_keep = ['PINCP', 'JWMNP', 'POVPIP', 'RAC1P']
clean_sf = sf_data[columns_to_keep].dropna()

# Rename for clarity
clean_sf.columns = ['Income', 'TransitTime', 'PovertyRatio', 'RaceCode']

# 4. Save to CSV
clean_sf.to_csv("SanFrancisco_Census_Cleaned.csv", index=False)
print("Success! Saved 'SanFrancisco_Census_Cleaned.csv'")