import type { DayPrediction } from "./mlPredictor";

export interface SavedPrediction {
  id: number;
  locality: string;
  created_at: string;
  predictions: DayPrediction[];
}

const STORAGE_KEY = "voltforecast_predictions";

export function loadSavedPredictions(): SavedPrediction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePrediction(
  locality: string,
  predictions: DayPrediction[],
): SavedPrediction {
  const all = loadSavedPredictions();
  const newItem: SavedPrediction = {
    id: Date.now(),
    locality,
    created_at: new Date().toISOString(),
    predictions,
  };
  all.unshift(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)));
  return newItem;
}

export function deletePrediction(id: number): void {
  const all = loadSavedPredictions();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(all.filter((p) => p.id !== id)),
  );
}
