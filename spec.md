# ElectroWeather Predictor

## Current State
The app predicts 5-day electricity demand using ML regression based on weather data for 152 Indian cities. It shows a forecast chart, KPI cards, historical chart, and saved predictions.

## Requested Changes (Diff)

### Add
- New utility function `recommendEnergySource(predictions)` that scores Solar, Wind, Hydro, Thermal, and Nuclear based on weather conditions (temperature, humidity, wind speed, weather condition) for each predicted day.
- New component `EnergySourceRecommendation.tsx` showing a card with:
  - Best recommended energy source overall (badge + icon)
  - Per-day breakdown table/grid showing top method for each of 5 forecast days
  - Score bars or visual indicator for each source type
  - Brief reasoning text (e.g. "High solar irradiance expected", "Strong winds favor wind turbines")

### Modify
- App.tsx: Render `EnergySourceRecommendation` between the KPI cards and historical chart.

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/utils/energyRecommendation.ts` with scoring logic per energy type based on weather inputs.
2. Create `src/frontend/src/components/EnergySourceRecommendation.tsx` with the UI card.
3. Update App.tsx to render the new component using existing `predictions` state.
