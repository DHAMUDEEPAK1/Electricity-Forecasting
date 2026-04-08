import { Slider } from "@/components/ui/slider";
import { Droplets, Thermometer, Wind } from "lucide-react";
import type { WeatherInput } from "../utils/mlPredictor";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getFutureDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const FUTURE_DATES = [1, 2, 3, 4, 5].map(getFutureDate);

interface Props {
  weather: WeatherInput[];
  onChange: (idx: number, field: keyof WeatherInput, val: number) => void;
}

export default function ManualWeatherInput({ weather, onChange }: Props) {
  return (
    <div className="card-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
        Manual Weather Input \u2014 5 Day Forecast
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {weather.map((w, i) => (
          <div
            key={FUTURE_DATES[i]}
            className="space-y-3 p-3 rounded-lg bg-background/50 border border-border"
            data-ocid={`weather.item.${i + 1}`}
          >
            <p className="text-xs font-semibold text-foreground text-center">
              {FUTURE_DATES[i]}
            </p>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Thermometer size={12} className="text-muted-foreground" />
                <span className="text-xs font-mono text-electric">
                  {w.temperature}\u00b0C
                </span>
              </div>
              <Slider
                min={-10}
                max={50}
                step={0.5}
                value={[w.temperature]}
                onValueChange={([v]) => onChange(i, "temperature", v)}
                className="w-full"
                data-ocid={`weather.temperature.${i + 1}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Droplets size={12} className="text-muted-foreground" />
                <span className="text-xs font-mono text-teal">
                  {w.humidity}%
                </span>
              </div>
              <Slider
                min={10}
                max={100}
                step={1}
                value={[w.humidity]}
                onValueChange={([v]) => onChange(i, "humidity", v)}
                className="w-full"
                data-ocid={`weather.humidity.${i + 1}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Wind size={12} className="text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">
                  {w.wind_speed} km/h
                </span>
              </div>
              <Slider
                min={0}
                max={80}
                step={0.5}
                value={[w.wind_speed]}
                onValueChange={([v]) => onChange(i, "wind_speed", v)}
                className="w-full"
                data-ocid={`weather.wind.${i + 1}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
