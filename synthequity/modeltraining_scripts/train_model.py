# train_model.py
import pandas as pd
from sklearn.linear_model import LinearRegression
import json

# 1. Load your CTGAN-generated data
df = pd.read_csv("synthetic_city_data.csv")
X = df[['income_norm', 'transit_score', 'distance_km']]
y = df['health_disparity_score']

# 2. Train the model
model = LinearRegression()
model.fit(X, y)

# 3. Extract the "Brains" of the model
model_config = {
    "weights": {
        "income_weight": model.coef_[0],
        "transit_weight": model.coef_[1],
        "distance_weight": model.coef_[2]
    },
    "intercept": model.intercept_
}

# 4. Save to a JSON file (or just copy-paste the output)
with open('model_weights.json', 'w') as f:
    json.dump(model_config, f)
    
print("Model exported!", model_config)