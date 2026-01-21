# Synthetic Population Data Dictionary

This dataset represents a **synthetic population** generated via CTGAN based on ACS Census Microdata. No real PII (Personally Identifiable Information) is included.

| Field | Type | Description |
| :--- | :--- | :--- |
| `synthetic_id` | String | Unique anonymized identifier for the synthetic agent. |
| `census_tract` | String | The FIPS code for the geographic census tract source. |
| `location` | Object | Jittered coordinate pair (Lat/Lng) to represent residence within the census block. |
| `demographics.household_income` | Integer | Annual household income (USD) synthesized from ACS income distributions. |
| `demographics.insurance_status` | String | Predicted insurance coverage (Medicaid, Medicare, Private, Uninsured). |
| `vulnerability_metrics.transit_score` | Float (0-1) | Normalized score representing public transit density (1 = High Access, 0 = Low Access). |
| `simulation_flags.is_medical_desert` | Boolean | Derived flag: True if transit time to nearest facility > 45 mins. |