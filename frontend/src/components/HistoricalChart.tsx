import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoricalRecord } from "../utils/historicalData";
import { getMonthlyAverages } from "../utils/historicalData";

interface Props {
  records: HistoricalRecord[];
  localityStats: {
    avg_demand: number;
    peak_demand: number;
    min_demand: number;
    data_points: number;
  } | null;
}

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

const BAR_COLORS = [
  "#4AA3FF",
  "#5AB0FF",
  "#6ABDFF",
  "#26D07C",
  "#35D988",
  "#44E295",
  "#4AA3FF",
  "#5AB0FF",
  "#6ABDFF",
  "#26D07C",
  "#35D988",
  "#44E295",
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface p-3 text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-electric font-mono mt-1">
        {payload[0]?.value?.toLocaleString()} MW avg
      </p>
    </div>
  );
};

function generateInsights(
  records: HistoricalRecord[],
  year: number,
  stats: Props["localityStats"],
) {
  const monthly = getMonthlyAverages(records, year);
  const nonZero = monthly.filter((m) => m.avg_demand > 0);
  if (nonZero.length === 0 || !stats) return [];
  const peak = nonZero.reduce((a, b) => (a.avg_demand > b.avg_demand ? a : b));
  const low = nonZero.reduce((a, b) => (a.avg_demand < b.avg_demand ? a : b));
  const yearAvg = Math.round(
    nonZero.reduce((a, b) => a + b.avg_demand, 0) / nonZero.length,
  );
  return [
    {
      title: "Peak Month",
      value: peak.month,
      desc: `${peak.avg_demand.toLocaleString()} MW average demand \u2014 highest consumption period`,
    },
    {
      title: "Low Demand Period",
      value: low.month,
      desc: `${low.avg_demand.toLocaleString()} MW average \u2014 grid stress lowest`,
    },
    {
      title: `${year} Annual Average`,
      value: `${yearAvg.toLocaleString()} MW`,
      desc: `${yearAvg > stats.avg_demand ? "Above" : "Below"} overall 5-year average of ${stats.avg_demand.toLocaleString()} MW`,
    },
  ];
}

export default function HistoricalChart({ records, localityStats }: Props) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const monthly = getMonthlyAverages(records, selectedYear);
  const insights = generateInsights(records, selectedYear, localityStats);

  return (
    <div className="card-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Historical Data Analysis (2021\u20132026)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly average electricity demand by year
          </p>
        </div>
        <div className="flex gap-1" data-ocid="historical.tab">
          {YEARS.map((y) => (
            <button
              type="button"
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                selectedYear === y
                  ? "bg-primary text-background glow-blue"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthly}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4AA3FF" stopOpacity={1} />
                  <stop offset="100%" stopColor="#26D07C" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1E2733"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#A9B6C6", fontSize: 11 }}
                axisLine={{ stroke: "#263040" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#A9B6C6", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(74,163,255,0.08)" }}
              />
              <Bar dataKey="avg_demand" radius={[4, 4, 0, 0]}>
                {monthly.map((entry, i) => (
                  <Cell
                    key={entry.month}
                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Predictive Insights
          </h3>
          {insights.map((ins) => (
            <div
              key={ins.title}
              className="p-3 rounded-lg bg-background/50 border border-border"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {ins.title}
                </span>
                <span className="text-sm font-semibold text-electric">
                  {ins.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ins.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
