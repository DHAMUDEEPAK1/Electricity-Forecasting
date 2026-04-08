import type { DayPrediction } from "./mlPredictor";

export type EnergySource = "Solar" | "Wind" | "Hydro" | "Thermal" | "Nuclear";

export interface DayEnergyRecommendation {
  date: string;
  best: EnergySource;
  scores: Record<EnergySource, number>;
  reason: string;
}

export interface EnergyRecommendationResult {
  overallBest: EnergySource;
  overallReason: string;
  daily: DayEnergyRecommendation[];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function scoreSolar(p: DayPrediction): number {
  let score = 50;
  if (p.weather_condition === "sunny") score += 35;
  else if (p.weather_condition === "cloudy") score -= 15;
  else if (p.weather_condition === "rainy" || p.weather_condition === "stormy")
    score -= 30;
  if (p.temperature >= 25 && p.temperature <= 40) score += 10;
  else if (p.temperature < 20) score -= 10;
  if (p.humidity < 40) score += 5;
  else if (p.humidity >= 60) score -= 10;
  else if (p.humidity >= 80) score -= 20;
  return clamp(score, 0, 100);
}

function scoreWind(p: DayPrediction): number {
  let score = 30;
  score += clamp(p.wind_speed * 2.5, 0, 55);
  if (p.weather_condition === "windy") score += 15;
  else if (p.weather_condition === "stormy") score += 10;
  return clamp(score, 0, 100);
}

function scoreHydro(p: DayPrediction): number {
  let score = 40;
  if (p.weather_condition === "rainy") score += 35;
  else if (p.weather_condition === "stormy") score += 20;
  if (p.humidity > 80) score += 15;
  else if (p.humidity > 70) score += 8;
  return clamp(score, 0, 100);
}

function scoreThermal(p: DayPrediction): number {
  let score = 55;
  if (p.demand_mw > 4000) score += 20;
  else if (p.demand_mw > 3000) score += 10;
  return clamp(score, 0, 100);
}

function scoreNuclear(p: DayPrediction): number {
  let score = 50;
  if (p.demand_mw > 4000) score += 15;
  else if (p.demand_mw > 3000) score += 8;
  return clamp(score, 0, 100);
}

const REASON_MAP: Record<EnergySource, string> = {
  Solar: "Clear skies and optimal temperatures favor solar generation",
  Wind: "High wind speeds make wind turbines most efficient",
  Hydro: "High humidity and rainfall indicators support hydro generation",
  Thermal: "High demand periods call for reliable thermal baseload",
  Nuclear: "Steady baseload from nuclear suits high-demand conditions",
};

export function recommendEnergySource(
  predictions: DayPrediction[],
): EnergyRecommendationResult {
  const daily: DayEnergyRecommendation[] = predictions.map((p) => {
    const scores: Record<EnergySource, number> = {
      Solar: scoreSolar(p),
      Wind: scoreWind(p),
      Hydro: scoreHydro(p),
      Thermal: scoreThermal(p),
      Nuclear: scoreNuclear(p),
    };
    const best = (Object.keys(scores) as EnergySource[]).reduce((a, b) =>
      scores[a] >= scores[b] ? a : b,
    );
    return { date: p.date, best, scores, reason: REASON_MAP[best] };
  });

  const tally: Record<EnergySource, number> = {
    Solar: 0,
    Wind: 0,
    Hydro: 0,
    Thermal: 0,
    Nuclear: 0,
  };
  for (const d of daily) tally[d.best]++;
  const overallBest = (Object.keys(tally) as EnergySource[]).reduce((a, b) =>
    tally[a] >= tally[b] ? a : b,
  );

  return { overallBest, overallReason: REASON_MAP[overallBest], daily };
}
