const API_BASE = "http://localhost:5000/api";

export interface DayPrediction {
  date: string;
  demand_mw: number;
  confidence: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  upper_bound: number;
  lower_bound: number;
  historical_avg: number;
  weather_condition: "sunny" | "cloudy" | "rainy" | "stormy" | "windy";
}

export interface WeatherInput {
  temperature: number;
  humidity: number;
  wind_speed: number;
}

export interface HistoricalRecord {
  date: string;
  demand_mw: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  locality: string;
}

export interface LocalityStats {
  avg_demand: number;
  peak_demand: number;
  min_demand: number;
  data_points: number;
}

export interface EnergyRecommendation {
  overallBest: string;
  overallReason: string;
  daily: {
    date: string;
    best: string;
    scores: Record<string, number>;
    reason: string;
  }[];
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export async function getLocalities(): Promise<string[]> {
  const data = await fetchJson<{ localities: string[] }>(
    `${API_BASE}/localities`
  );
  return data.localities;
}

export async function getLocalityCoords(): Promise<Record<string, [number, number]>> {
  const data = await fetchJson<{ coords: Record<string, [number, number]> }>(
    `${API_BASE}/localities/coords`
  );
  return data.coords;
}

export async function getHistoricalData(
  locality: string
): Promise<HistoricalRecord[]> {
  const data = await fetchJson<{ records: HistoricalRecord[] }>(
    `${API_BASE}/history?locality=${encodeURIComponent(locality)}`
  );
  return data.records;
}

export async function getLocalityStats(
  locality: string
): Promise<LocalityStats> {
  const data = await fetchJson<{ stats: LocalityStats }>(
    `${API_BASE}/history/stats?locality=${encodeURIComponent(locality)}`
  );
  return data.stats;
}

export async function getDefaultWeather(
  locality: string,
  days: number = 5
): Promise<WeatherInput[]> {
  const data = await fetchJson<{ weather: WeatherInput[] }>(
    `${API_BASE}/default-weather?locality=${encodeURIComponent(locality)}&days=${days}`
  );
  return data.weather;
}

export async function detectLocationWeather(
  lat: number,
  lng: number
): Promise<WeatherInput> {
  const data = await fetchJson<{ weather: WeatherInput }>(
    `${API_BASE}/detect-weather`,
    {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    }
  );
  return data.weather;
}

export async function getForecast(
  locality: string,
  weather?: WeatherInput[]
): Promise<DayPrediction[]> {
  const data = await fetchJson<{ predictions: DayPrediction[] }>(
    `${API_BASE}/forecast`,
    {
      method: "POST",
      body: JSON.stringify({
        locality,
        weather: weather || [],
      }),
    }
  );
  return data.predictions;
}

export async function getEnergyRecommendation(
  predictions: DayPrediction[]
): Promise<EnergyRecommendation> {
  return fetchJson<EnergyRecommendation>(`${API_BASE}/energy-recommend`, {
    method: "POST",
    body: JSON.stringify({ predictions }),
  });
}
