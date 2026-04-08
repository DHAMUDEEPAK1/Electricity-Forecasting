import {
  BarChart2,
  Droplets,
  Sun,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import type { DayPrediction } from "../utils/mlPredictor";

interface Props {
  todayPrediction: DayPrediction | null;
  localityStats: {
    avg_demand: number;
    peak_demand: number;
    min_demand: number;
    data_points: number;
  } | null;
}

function StatItem({
  icon,
  label,
  value,
  unit,
  color = "text-electric",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold ${color}`}>
          {value}
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function KPICards({
  todayPrediction: p,
  localityStats: stats,
}: Props) {
  if (!p) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dow = tomorrow.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const trend = stats && p.demand_mw > stats.avg_demand ? "up" : "down";
  const solarEst = Math.round(
    Math.max(0, (p.temperature - 5) * 0.8 + (1 - p.humidity / 100) * 200),
  );
  const windEst = Math.round(p.wind_speed * 12);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Weather Factors */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer size={16} className="text-electric" />
          <h3 className="text-sm font-semibold text-foreground">
            Weather Factors
          </h3>
          <span className="text-xs text-muted-foreground ml-auto">Current</span>
        </div>
        <StatItem
          icon={<Thermometer size={16} />}
          label="Temperature"
          value={p.temperature}
          unit="°C"
        />
        <StatItem
          icon={<Droplets size={16} />}
          label="Humidity"
          value={p.humidity}
          unit="%"
          color="text-teal"
        />
        <StatItem
          icon={<Wind size={16} />}
          label="Wind Speed"
          value={p.wind_speed}
          unit="km/h"
          color="text-muted-foreground"
        />
      </div>

      {/* Demand Factors (ML) */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-electric" />
          <h3 className="text-sm font-semibold text-foreground">
            Demand Factors
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-electric ml-auto">
            ML
          </span>
        </div>
        <StatItem
          icon={
            isWeekend ? (
              <span className="text-xs">🏠</span>
            ) : (
              <span className="text-xs">🏢</span>
            )
          }
          label="Day Type"
          value={isWeekend ? "Weekend" : "Weekday"}
          color={isWeekend ? "text-muted-foreground" : "text-foreground"}
        />
        <StatItem
          icon={
            trend === "up" ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )
          }
          label="Demand Trend"
          value={`${trend === "up" ? "↑" : "↓"} ${Math.abs(p.demand_mw - (stats?.avg_demand ?? p.demand_mw)).toLocaleString()} MW`}
          color={trend === "up" ? "text-destructive" : "text-teal"}
        />
        <StatItem
          icon={<Sun size={16} />}
          label="Est. Solar Gen"
          value={solarEst}
          unit="MWh"
          color="text-yellow-400"
        />
        <StatItem
          icon={<Wind size={16} />}
          label="Est. Wind Gen"
          value={windEst}
          unit="MWh"
          color="text-teal"
        />
      </div>

      {/* Regional Context */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 size={16} className="text-electric" />
          <h3 className="text-sm font-semibold text-foreground">
            Regional Context
          </h3>
        </div>
        {stats ? (
          <>
            <StatItem
              icon={<BarChart2 size={16} />}
              label="Avg Demand"
              value={stats.avg_demand.toLocaleString()}
              unit="MW"
            />
            <StatItem
              icon={<TrendingUp size={16} />}
              label="Peak Demand"
              value={stats.peak_demand.toLocaleString()}
              unit="MW"
              color="text-destructive"
            />
            <StatItem
              icon={<TrendingDown size={16} />}
              label="Min Demand"
              value={stats.min_demand.toLocaleString()}
              unit="MW"
              color="text-teal"
            />
            <StatItem
              icon={<Zap size={16} />}
              label="Data Points"
              value={stats.data_points.toLocaleString()}
              unit="days"
              color="text-muted-foreground"
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </div>
    </div>
  );
}
