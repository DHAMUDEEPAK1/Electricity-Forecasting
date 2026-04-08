import type { HistoricalRecord } from "./historicalData";

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

interface MLModel {
  baseline: number;
  temp_coef: number;
  humid_coef: number;
  wind_coef: number;
  month_coefs: number[];
  dow_coefs: number[];
  rmse: number;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getMonthCoef(records: HistoricalRecord[]): number[] {
  const coefs: number[] = new Array(12).fill(0);
  const counts: number[] = new Array(12).fill(0);
  for (const r of records) {
    const m = Number.parseInt(r.date.split("-")[1]) - 1;
    coefs[m] += r.demand_mw;
    counts[m]++;
  }
  const avgDemand = mean(records.map((r) => r.demand_mw));
  return coefs.map((total, i) =>
    counts[i] > 0 ? total / counts[i] - avgDemand : 0,
  );
}

function getDowCoef(records: HistoricalRecord[]): number[] {
  const coefs: number[] = new Array(7).fill(0);
  const counts: number[] = new Array(7).fill(0);
  for (const r of records) {
    const dow = new Date(r.date).getDay();
    coefs[dow] += r.demand_mw;
    counts[dow]++;
  }
  const avgDemand = mean(records.map((r) => r.demand_mw));
  return coefs.map((total, i) =>
    counts[i] > 0 ? total / counts[i] - avgDemand : 0,
  );
}

export function trainModel(records: HistoricalRecord[]): MLModel {
  if (records.length < 30) {
    return {
      baseline: 3000,
      temp_coef: 30,
      humid_coef: 5,
      wind_coef: -15,
      month_coefs: new Array(12).fill(0),
      dow_coefs: new Array(7).fill(0),
      rmse: 200,
    };
  }

  const n = records.length;
  const demands = records.map((r) => r.demand_mw);
  const temps = records.map((r) => r.temperature);
  const humids = records.map((r) => r.humidity);
  const winds = records.map((r) => r.wind_speed);

  const avgDemand = mean(demands);
  const avgTemp = mean(temps);
  const avgHumid = mean(humids);
  const avgWind = mean(winds);

  // Simple OLS using centered variables
  let xyT = 0;
  let xyH = 0;
  let xyW = 0;
  let xxT = 0;
  let xxH = 0;
  let xxW = 0;

  for (let i = 0; i < n; i++) {
    const dy = demands[i] - avgDemand;
    const dt = temps[i] - avgTemp;
    const dh = humids[i] - avgHumid;
    const dw = winds[i] - avgWind;
    xyT += dy * dt;
    xyH += dy * dh;
    xyW += dy * dw;
    xxT += dt * dt;
    xxH += dh * dh;
    xxW += dw * dw;
  }

  const temp_coef = xxT > 0 ? xyT / xxT : 30;
  const humid_coef = xxH > 0 ? xyH / xxH : 5;
  const wind_coef = xxW > 0 ? xyW / xxW : -15;
  const baseline =
    avgDemand -
    temp_coef * avgTemp -
    humid_coef * avgHumid -
    wind_coef * avgWind;

  const month_coefs = getMonthCoef(records);
  const dow_coefs = getDowCoef(records);

  // Calculate RMSE
  let sumSqErr = 0;
  for (const r of records) {
    const m = Number.parseInt(r.date.split("-")[1]) - 1;
    const dow = new Date(r.date).getDay();
    const pred =
      baseline +
      temp_coef * r.temperature +
      humid_coef * r.humidity +
      wind_coef * r.wind_speed +
      month_coefs[m] * 0.3 +
      dow_coefs[dow] * 0.3;
    sumSqErr += (r.demand_mw - pred) ** 2;
  }
  const rmse = Math.sqrt(sumSqErr / n);

  return {
    baseline,
    temp_coef,
    humid_coef,
    wind_coef,
    month_coefs,
    dow_coefs,
    rmse,
  };
}

function inferWeatherCondition(
  _temp: number,
  humidity: number,
  wind_speed: number,
): DayPrediction["weather_condition"] {
  if (wind_speed > 30) return "stormy";
  if (humidity > 80 && wind_speed > 15) return "rainy";
  if (humidity > 75) return "cloudy";
  if (wind_speed > 20) return "windy";
  return "sunny";
}

export function predict5Days(
  model: MLModel,
  weatherInputs: WeatherInput[],
  historicalRecords: HistoricalRecord[],
): DayPrediction[] {
  const today = new Date();
  const results: DayPrediction[] = [];
  const confidenceBands = [0.08, 0.12, 0.15, 0.15, 0.15];

  // Get historical averages for each month
  const monthlyAvg: Record<number, number[]> = {};
  for (const r of historicalRecords) {
    const m = Number.parseInt(r.date.split("-")[1]);
    if (!monthlyAvg[m]) monthlyAvg[m] = [];
    monthlyAvg[m].push(r.demand_mw);
  }
  const monthAvgMap: Record<number, number> = {};
  for (const [k, v] of Object.entries(monthlyAvg)) {
    monthAvgMap[Number(k)] = mean(v);
  }

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    const weather = weatherInputs[i];
    const month = d.getMonth();
    const dow = d.getDay();

    const predicted =
      model.baseline +
      model.temp_coef * weather.temperature +
      model.humid_coef * weather.humidity +
      model.wind_coef * weather.wind_speed +
      model.month_coefs[month] * 0.3 +
      model.dow_coefs[dow] * 0.3;

    const demand_mw = Math.max(500, Math.round(predicted));
    const band = confidenceBands[i];
    const confidence = Math.round((1 - band) * 100);

    results.push({
      date: d.toISOString().split("T")[0],
      demand_mw,
      confidence,
      temperature: weather.temperature,
      humidity: weather.humidity,
      wind_speed: weather.wind_speed,
      upper_bound: Math.round(demand_mw * (1 + band)),
      lower_bound: Math.round(demand_mw * (1 - band)),
      historical_avg: monthAvgMap[month + 1] ?? demand_mw,
      weather_condition: inferWeatherCondition(
        weather.temperature,
        weather.humidity,
        weather.wind_speed,
      ),
    });
  }

  return results;
}

export function getDefaultWeather(
  records: HistoricalRecord[],
  daysAhead: number,
): WeatherInput[] {
  const today = new Date();
  const results: WeatherInput[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    const month = d.getMonth() + 1;
    const sameMonth = records.filter(
      (r) => Number.parseInt(r.date.split("-")[1]) === month,
    );
    if (sameMonth.length > 0) {
      results.push({
        temperature:
          Math.round(mean(sameMonth.map((r) => r.temperature)) * 10) / 10,
        humidity: Math.round(mean(sameMonth.map((r) => r.humidity))),
        wind_speed:
          Math.round(mean(sameMonth.map((r) => r.wind_speed)) * 10) / 10,
      });
    } else {
      results.push({ temperature: 20, humidity: 60, wind_speed: 12 });
    }
  }
  return results;
}

export function detectLocationWeather(lat: number, lng: number): WeatherInput {
  const today = new Date();
  const month = today.getMonth();
  const seasonalTemp = Math.sin(((month - 2) * Math.PI) / 6) * 12;
  const baseTemp = lat > 30 ? 28 - (lat - 30) * 0.7 : 28;
  return {
    temperature: Math.round((baseTemp + seasonalTemp) * 10) / 10,
    humidity: Math.round(60 + Math.sin((month * Math.PI) / 3) * 15),
    wind_speed: Math.round((10 + Math.abs(lng) * 0.02) * 10) / 10,
  };
}
