import pandas as pd
from folktables import ACSDataSource

# ==========================================
# CONFIGURATION: CITY DEFINITIONS
# ==========================================
# Census data is organized by "PUMA" (Public Use Microdata Area).
# Each PUMA represents ~100k people. We list the PUMAs that roughly 
# correspond to the city limits for 2018 ACS data.
CITY_CONFIG = {
    'CA': {
        'San Francisco': [7501, 7502, 7503, 7504, 7505, 7506, 7507]
    },
    'TX': {
        # Travis County PUMAs covering Austin
        'Austin': [5301, 5302, 5303, 5304, 5305, 5306, 5307, 5308]
    },
    'MA': {
        # Suffolk County / Boston City
        'Boston': [3301, 3302, 3303, 3304, 3305]
    },
    'MD': {
        # Baltimore City (Independent City)
        'Baltimore': [2501, 2502, 2503, 2504, 2505]
    },
    'NJ': {
        # Hudson County (Jersey City & Hoboken area)
        'Jersey City': [1701, 1702]
    },
    'AZ': {
        # Phoenix City (Maricopa County sub-areas)
        'Phoenix': [112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122]
    }
}

def download_and_process():
    print("Initialize US Census Data Downloader (Source: ACS 2018 1-Year Person Survey)...")
    
    # We will store all processed city dataframes here
    all_cities_data = []

    data_source = ACSDataSource(survey_year='2018', horizon='1-Year', survey='person')

    # Loop through each state in our config
    for state_code, cities in CITY_CONFIG.items():
        print(f"\n--- Processing State: {state_code} ---")
        
        # 1. Download State Data (Heavy Operation)
        try:
            state_data = data_source.get_data(states=[state_code], download=True)
        except Exception as e:
            print(f"Error downloading {state_code}: {e}")
            continue

        # 2. Extract specific cities from this state
        for city_name, pumas in cities.items():
            print(f"   Extracting {city_name} (PUMAs: {pumas})...")
            
            # Filter rows where PUMA matches our list
            city_df = state_data[state_data['PUMA'].isin(pumas)].copy()
            
            if city_df.empty:
                print(f"   WARNING: No data found for {city_name}. Check PUMA codes.")
                continue

            # 3. Select & Rename Columns
            # PINCP = Total Income
            # JWMNP = Travel Time to Work (Minutes) -> Proxy for transit convenience
            # POVPIP = Income-to-Poverty Ratio
            # RAC1P = Race Code (1=White, 2=Black, 6=Asian, etc.)
            subset = city_df[['PINCP', 'JWMNP', 'POVPIP', 'RAC1P']].dropna()
            subset.columns = ['Income', 'TransitTime', 'PovertyRatio', 'RaceCode']
            
            # 4. Add the City Name column
            subset['City_Name'] = city_name
            
            # 5. Add to master list
            all_cities_data.append(subset)
            print(f"   -> Added {len(subset)} rows.")

    # ==========================================
    # FINALIZE
    # ==========================================
    print("\nCombining all cities...")
    final_df = pd.concat(all_cities_data, ignore_index=True)
    
    output_filename = "MultiCity_Census_Cleaned.csv"
    final_df.to_csv(output_filename, index=False)
    
    print(f"SUCCESS! Saved {len(final_df)} rows to '{output_filename}'")
    print(f"breakdown by city:\n{final_df['City_Name'].value_counts()}")

if __name__ == "__main__":
    download_and_process()