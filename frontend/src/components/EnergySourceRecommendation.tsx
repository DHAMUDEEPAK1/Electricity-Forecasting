import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { getEnergyRecommendation, type DayPrediction, type EnergyRecommendation } from "../utils/api";

type EnergySource = "Solar" | "Wind" | "Hydro" | "Thermal" | "Nuclear";

interface Props {
  predictions: DayPrediction[];
}

const SOURCE_META: Record<
  EnergySource,
  { icon: string; label: string; colorClass: string; barClass: string }
> = {
  Solar: {
    icon: "☀️",
    label: "Solar",
    colorClass: "text-amber-400 bg-amber-400/20 border-amber-400/30",
    barClass: "bg-gradient-to-r from-amber-500 to-yellow-300",
  },
  Wind: {
    icon: "💨",
    label: "Wind",
    colorClass: "text-sky-400 bg-sky-400/20 border-sky-400/30",
    barClass: "bg-gradient-to-r from-sky-500 to-cyan-300",
  },
  Hydro: {
    icon: "💧",
    label: "Hydro",
    colorClass: "text-blue-400 bg-blue-400/20 border-blue-400/30",
    barClass: "bg-gradient-to-r from-blue-600 to-indigo-400",
  },
  Thermal: {
    icon: "🔥",
    label: "Thermal",
    colorClass: "text-orange-400 bg-orange-400/20 border-orange-400/30",
    barClass: "bg-gradient-to-r from-orange-600 to-red-400",
  },
  Nuclear: {
    icon: "⚛️",
    label: "Nuclear",
    colorClass: "text-purple-400 bg-purple-400/20 border-purple-400/30",
    barClass: "bg-gradient-to-r from-purple-600 to-fuchsia-400",
  },
};

const ALL_SOURCES: EnergySource[] = [
  "Solar",
  "Wind",
  "Hydro",
  "Thermal",
  "Nuclear",
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function EnergySourceRecommendation({ predictions }: Props) {
  const [result, setResult] = useState<EnergyRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendation() {
      if (!predictions || predictions.length === 0) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getEnergyRecommendation(predictions);
        setResult(data);
      } catch (error) {
        console.error("Failed to get energy recommendation:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecommendation();
  }, [predictions]);

  if (isLoading || !result) {
    return (
      <div className="card-surface rounded-xl p-5" data-ocid="energy.card">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const overall = SOURCE_META[result.overallBest as EnergySource] || SOURCE_META.Solar;

  // Compute average scores across all days
  const avgScores: Record<EnergySource, number> = {
    Solar: 0,
    Wind: 0,
    Hydro: 0,
    Thermal: 0,
    Nuclear: 0,
  };
  for (const d of result.daily) {
    for (const src of ALL_SOURCES) {
      avgScores[src] += d.scores[src] || 0;
    }
  }
  const n = result.daily.length || 1;
  for (const src of ALL_SOURCES)
    avgScores[src] = Math.round(avgScores[src] / n);

  const maxAvg = Math.max(...Object.values(avgScores));

  return (
    <div className="card-surface rounded-xl p-5" data-ocid="energy.card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-base">⚡</span>
        <h2 className="text-sm font-semibold text-foreground tracking-wide">
          Best Electricity Production Method
        </h2>
      </div>

      {/* Overall best */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border shadow-inner-glow"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl drop-shadow-lg">{overall.icon}</span>
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter opacity-70">
              Overall Recommendation
            </p>
            <Badge
              className={`text-sm font-bold px-3 py-1 border shadow-sm ${overall.colorClass}`}
              data-ocid="energy.primary_button"
            >
              {overall.label}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-balance text-muted-foreground sm:ml-4 leading-relaxed">
          {result.overallReason}
        </p>
      </motion.div>

      {/* 5-day grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {result.daily.map((day, idx) => {
          const meta = SOURCE_META[day.best];
          const topScore = day.scores[day.best];
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-border transition-colors group cursor-default"
              data-ocid={`energy.item.${idx + 1}`}
            >
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                {formatDate(day.date)}
              </p>
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                {meta.icon}
              </span>
              <Badge
                className={`text-[10px] px-2 py-0.5 border ${meta.colorClass}`}
              >
                {meta.label}
              </Badge>
              {/* Mini score bar */}
              <div className="w-full h-1 rounded-full bg-muted/50 mt-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topScore}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
                  className={`h-1 rounded-full ${meta.barClass}`}
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground">
                {topScore}%
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Average score comparison */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            5-Day Average Score Comparison
          </p>
          <span className="text-[10px] text-muted-foreground/60 italic">
            Relative Efficiency
          </span>
        </div>
        {ALL_SOURCES.map((src, idx) => {
          const meta = SOURCE_META[src];
          const score = avgScores[src];
          const widthPct = maxAvg > 0 ? (score / maxAvg) * 100 : 0;
          return (
            <div key={src} className="flex items-center gap-3 group">
              <span className="text-lg w-7 text-center flex-shrink-0 group-hover:scale-125 transition-transform">
                {meta.icon}
              </span>
              <span className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0 group-hover:text-foreground transition-colors">
                {meta.label}
              </span>
              <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden border border-border/20 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                  className={`h-full rounded-full ${meta.barClass} shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]`}
                />
              </div>
              <span
                className={`text-xs font-black w-8 text-right tabular-nums ${meta.colorClass.split(" ")[0]}`}
              >
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
