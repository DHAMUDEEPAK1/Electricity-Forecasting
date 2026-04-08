import { Button } from "@/components/ui/button";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  Loader2,
  Save,
  Sun,
  Wind,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPrediction } from "../utils/mlPredictor";

interface Props {
  predictions: DayPrediction[];
  onSave: () => void;
  isSaving: boolean;
}

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

function formatDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function WeatherIcon({
  condition,
  size = 18,
}: {
  condition: DayPrediction["weather_condition"];
  size?: number;
}) {
  const props = { size, className: "" };
  switch (condition) {
    case "sunny":
      return <Sun {...props} className="text-yellow-400" />;
    case "cloudy":
      return <Cloud {...props} className="text-slate-400" />;
    case "rainy":
      return <CloudRain {...props} className="text-blue-400" />;
    case "stormy":
      return <CloudLightning {...props} className="text-purple-400" />;
    case "windy":
      return <Wind {...props} className="text-teal-400" />;
    default:
      return <Sun {...props} className="text-yellow-400" />;
  }
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="card-surface p-3 text-xs space-y-1 min-w-[180px]">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-electric font-mono">
        {d?.demand_mw?.toLocaleString()} MW demand
      </p>
      <p className="text-muted-foreground">Confidence: {d?.confidence}%</p>
      <p className="text-muted-foreground">
        Range: {d?.lower_bound?.toLocaleString()} –{" "}
        {d?.upper_bound?.toLocaleString()} MW
      </p>
      <p className="text-muted-foreground">
        Hist. avg: {d?.historical_avg?.toLocaleString()} MW
      </p>
    </div>
  );
};

export default function ForecastChart({
  predictions,
  onSave,
  isSaving,
}: Props) {
  const data = predictions.map((p) => ({
    ...p,
    name: formatDay(p.date),
  }));

  return (
    <div className="card-surface p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            5-Day Electricity Demand &amp; Weather Forecast
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            ML-powered prediction with confidence intervals
          </p>
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="bg-transparent border border-electric text-electric hover:bg-electric hover:text-background transition-all glow-blue text-sm px-4 h-8"
          data-ocid="forecast.save_button"
        >
          {isSaving ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Save size={14} className="mr-2" />
          )}
          Save Prediction
        </Button>
      </div>

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4AA3FF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4AA3FF" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E2733"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#A9B6C6", fontSize: 12 }}
              axisLine={{ stroke: "#263040" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#A9B6C6", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#A9B6C6" }}
              iconType="line"
            />
            <Area
              type="monotone"
              dataKey="upper_bound"
              name="Upper Bound"
              stroke="none"
              fill="url(#bandGrad)"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lower_bound"
              name="Lower Bound"
              stroke="none"
              fill="#0B0F14"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="historical_avg"
              name="Historical Avg"
              stroke="#7E8A9B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="demand_mw"
              name="Forecast Demand"
              stroke="#4AA3FF"
              strokeWidth={2.5}
              dot={{ fill: "#4AA3FF", r: 5, strokeWidth: 2, stroke: "#0B0F14" }}
              activeDot={{
                r: 7,
                fill: "#4AA3FF",
                stroke: "#0B0F14",
                strokeWidth: 2,
              }}
              style={{ filter: "drop-shadow(0 0 6px rgba(74,163,255,0.8))" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Weather strip */}
      <div className="border-t border-border pt-3">
        <div className="grid grid-cols-5 gap-2">
          {predictions.map((p) => (
            <div
              key={p.date}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50"
            >
              <WeatherIcon condition={p.weather_condition} size={20} />
              <span className="text-xs text-muted-foreground">
                {formatDay(p.date).split(" ")[0]}
              </span>
              <span className="text-sm font-medium text-foreground">
                {p.temperature}\u00b0C
              </span>
              <span className="text-xs text-muted-foreground">
                {p.humidity}% RH
              </span>
              <span className="text-xs text-muted-foreground">
                {p.wind_speed} km/h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
