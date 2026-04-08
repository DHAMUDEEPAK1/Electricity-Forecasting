import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  ChevronDown,
  Clock,
  Grid3X3,
  LineChart,
  MapPin,
  Navigation,
  Search,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import EnergySourceRecommendation from "./components/EnergySourceRecommendation";
import ForecastChart from "./components/ForecastChart";
import HistoricalChart from "./components/HistoricalChart";
import KPICards from "./components/KPICards";
import ManualWeatherInput from "./components/ManualWeatherInput";
import SavedPredictionsPanel from "./components/SavedPredictionsPanel";

import {
  deletePrediction as deleteFromStorage,
  loadSavedPredictions,
  savePrediction as saveToStorage,
} from "./utils/savedPredictions";
import type { SavedPrediction } from "./utils/savedPredictions";
import {
  getLocalities,
  getLocalityCoords,
  getHistoricalData,
  getLocalityStats as getStatsFromApi,
  getDefaultWeather as getWeatherFromApi,
  detectLocationWeather,
  getForecast,
  type DayPrediction,
  type WeatherInput,
  type LocalityStats,
  type HistoricalRecord,
} from "./utils/api";

const NAV_ITEMS = [
  { label: "Dashboard", icon: Grid3X3 },
  { label: "Forecasting", icon: TrendingUp },
  { label: "Historical", icon: LineChart },
  { label: "Reports", icon: Activity },
];

const ALL_CITY_COORDS: Record<string, [number, number]> = {};
"Bhavnagar, GJ": [21.76, 72.15],
  "Jamnagar, GJ": [22.47, 70.07],
    "Junagadh, GJ": [21.52, 70.46],
      "Visakhapatnam, AP": [17.69, 83.22],
        "Vijayawada, AP": [16.51, 80.62],
          "Guntur, AP": [16.3, 80.44],
            "Kurnool, AP": [15.83, 78.04],
              "Kadapa, AP": [14.47, 78.82],
                "Rajahmundry, AP": [17.01, 81.8],
                  "Tirupati, AP": [13.63, 79.42],
                    "Coimbatore, TN": [11.02, 76.96],
                      "Madurai, TN": [9.93, 78.12],
                        "Tiruchirappalli, TN": [10.79, 78.7],
                          "Salem, TN": [11.66, 78.15],
                            "Tirunelveli, TN": [8.73, 77.7],
                              "Ambattur, TN": [13.11, 80.15],
                                "Erode, TN": [11.34, 77.73],
                                  "Avadi, TN": [13.11, 80.1],
                                    "Mysuru, KA": [12.31, 76.66],
                                      "Hubballi-Dharwad, KA": [15.36, 75.14],
                                        "Mangaluru, KA": [12.91, 74.86],
                                          "Belgaum, KA": [15.85, 74.5],
                                            "Gulbarga, KA": [17.33, 76.82],
                                              "Shimoga, KA": [13.93, 75.56],
                                                "Tumkur, KA": [13.34, 77.1],
                                                  "Bellary, KA": [15.14, 76.92],
                                                    "Kochi, KL": [9.93, 76.26],
                                                      "Thiruvananthapuram, KL": [8.52, 76.94],
                                                        "Kozhikode, KL": [11.25, 75.78],
                                                          "Thrissur, KL": [10.53, 76.22],
                                                            "Kollam, KL": [8.88, 76.59],
                                                              "Howrah, WB": [22.59, 88.31],
                                                                "Durgapur, WB": [23.48, 87.31],
                                                                  "Asansol, WB": [23.68, 86.99],
                                                                    "Siliguri, WB": [26.72, 88.43],
                                                                      "Rajpur Sonarpur, WB": [22.44, 88.39],
                                                                        "Bhatpara, WB": [22.87, 88.41],
                                                                          "Panihati, WB": [22.69, 88.37],
                                                                            "South Dumdum, WB": [22.63, 88.4],
                                                                              "Kamarhati, WB": [22.67, 88.37],
                                                                                "Bardhaman, WB": [23.23, 87.86],
                                                                                  "Kulti, WB": [23.73, 86.85],
                                                                                    "Kharagpur, WB": [22.33, 87.32],
                                                                                      "Ranchi, JH": [23.36, 85.33],
                                                                                        "Dhanbad, JH": [23.8, 86.43],
                                                                                          "Jamshedpur, JH": [22.8, 86.19],
                                                                                            "Bokaro, JH": [23.67, 85.98],
                                                                                              "Bhubaneswar, OD": [20.3, 85.82],
                                                                                                "Cuttack, OD": [20.46, 85.88],
                                                                                                  "Brahmapur, OD": [19.31, 84.79],
                                                                                                    "Gopalpur, OD": [19.26, 84.89],
                                                                                                      "Patna, BR": [25.6, 85.1],
                                                                                                        "Gaya, BR": [24.8, 85.0],
                                                                                                          "Muzaffarpur, BR": [26.12, 85.39],
                                                                                                            "Bhagalpur, BR": [25.24, 87.01],
                                                                                                              "Raipur, CG": [21.25, 81.63],
                                                                                                                "Bhilai, CG": [21.21, 81.38],
                                                                                                                  "Korba, CG": [22.35, 82.7],
                                                                                                                    "Bilaspur, CG": [22.08, 82.15],
                                                                                                                      "Ludhiana, PB": [30.9, 75.86],
                                                                                                                        "Amritsar, PB": [31.64, 74.87],
                                                                                                                          "Jalandhar, PB": [31.33, 75.58],
                                                                                                                            "Patiala, PB": [30.34, 76.39],
                                                                                                                              "Faridabad, HR": [28.41, 77.31],
                                                                                                                                "Gurgaon, HR": [28.46, 77.03],
                                                                                                                                  "Rohtak, HR": [28.89, 76.59],
                                                                                                                                    "Chandigarh, CH": [30.74, 76.79],
                                                                                                                                      "Guwahati, AS": [26.14, 91.74],
                                                                                                                                        "Dispur, AS": [26.14, 91.78],
                                                                                                                                          "Agartala, TR": [23.83, 91.28],
                                                                                                                                            "Imphal, MN": [24.82, 93.94],
                                                                                                                                              "Itanagar, AR": [27.1, 93.62],
                                                                                                                                                "Kohima, NL": [25.67, 94.11],
                                                                                                                                                  "Aizawl, MZ": [23.72, 92.72],
                                                                                                                                                    "Srinagar, JK": [34.08, 74.8],
                                                                                                                                                      "Jammu, JK": [32.73, 74.87],
                                                                                                                                                        "Dehradun, UK": [30.32, 78.03],
                                                                                                                                                          "Shimla, HP": [31.1, 77.17],
                                                                                                                                                            "Gangtok, SK": [27.33, 88.61],
                                                                                                                                                              "Warangal, TS": [18.0, 79.58],
                                                                                                                                                                "Nizamabad, TS": [18.67, 78.1],
                                                                                                                                                                  "Panaji, GA": [15.5, 73.83],
                                                                                                                                                                    "Port Blair, AN": [11.66, 92.74],
};

export default function App() {
  const [LOCALITIES, setLOCALITIES] = useState<string[]>([]);
  const [locality, setLocality] = useState("");
  const [inputMode, setInputMode] = useState<"auto" | "manual">("auto");
  const [isDetecting, setIsDetecting] = useState(false);
  const [weather, setWeather] = useState<WeatherInput[]>([]);
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedList, setSavedList] = useState<SavedPrediction[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [citySearch, setCitySearch] = useState("");
  const [analystOpen, setAnalystOpen] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalRecord[]>([]);
  const [localityStats, setLocalityStats] = useState<LocalityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const analystRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [localities, coords] = await Promise.all([
          getLocalities(),
          getLocalityCoords(),
        ]);
        setLOCALITIES(localities);
        Object.assign(ALL_CITY_COORDS, coords);

        if (localities.length > 0) {
          setLocality(localities[0]);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast.error("Failed to load data from server");
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!locality) return;

    async function loadLocalityData() {
      setIsLoading(true);
      try {
        const [history, stats] = await Promise.all([
          getHistoricalData(locality),
          getStatsFromApi(locality),
        ]);
        setHistoricalData(history);
        setLocalityStats(stats);

        const defaultWeather = await getWeatherFromApi(locality, 5);
        setWeather(defaultWeather);

        const forecast = await getForecast(locality, defaultWeather);
        setPredictions(forecast);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to load locality data:", error);
        toast.error("Failed to load forecast data");
      } finally {
        setIsLoading(false);
      }
    }
    loadLocalityData();
  }, [locality]);

  const filteredLocalities = useMemo(() => {
    if (!citySearch.trim()) return LOCALITIES;
    const q = citySearch.toLowerCase();
    return LOCALITIES.filter((l) => l.toLowerCase().includes(q));
  }, [citySearch, LOCALITIES]);

  const runPrediction = useCallback(
    async (weatherInputs: WeatherInput[]) => {
      try {
        const forecast = await getForecast(locality, weatherInputs);
        setPredictions(forecast);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to run prediction:", error);
        toast.error("Failed to get forecast");
      }
    },
    [locality],
  );

  useEffect(() => {
    if (inputMode === "manual" && weather.length === 5 && !isLoading) {
      runPrediction(weather);
    }
  }, [weather, inputMode, runPrediction, isLoading]);

  useEffect(() => {
    setSavedList(loadSavedPredictions());
  }, []);

  // Close analyst dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        analystRef.current &&
        !analystRef.current.contains(e.target as Node)
      ) {
        setAnalystOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      setIsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = (lat1: number, lng1: number, lat2: number, lng2: number) =>
          Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
        let nearest = LOCALITIES[0] || "Mumbai, MH";
        let minDist = Number.POSITIVE_INFINITY;
        for (const [name, [la, lo]] of Object.entries(ALL_CITY_COORDS)) {
          const d = dist(latitude, longitude, la, lo);
          if (d < minDist) {
            minDist = d;
            nearest = name;
          }
        }
        setLocality(nearest);
        try {
          const detectedWeather = await detectLocationWeather(latitude, longitude);
          const newWeather = Array(5)
            .fill(null)
            .map(() => ({
              ...detectedWeather,
              temperature:
                Math.round(
                  (detectedWeather.temperature + (Math.random() - 0.5) * 2) * 10,
                ) / 10,
              wind_speed:
                Math.round(
                  (detectedWeather.wind_speed + (Math.random() - 0.5) * 3) * 10,
                ) / 10,
            }));
          setWeather(newWeather);
          setInputMode("auto");
          toast.success(`Location detected: ${nearest}`);
        } catch (error) {
          console.error("Failed to detect weather:", error);
          toast.error("Failed to get weather data");
        }
        setIsDetecting(false);
      },
      () => {
        setIsDetecting(false);
        toast.error("Could not detect location. Please allow location access.");
      },
    );
  };

  const handleWeatherChange = (
    idx: number,
    field: keyof WeatherInput,
    val: number,
  ) => {
    setWeather((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSave = async () => {
    if (predictions.length === 0) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveToStorage(locality, predictions);
    setSavedList(loadSavedPredictions());
    setIsSaving(false);
    toast.success("Prediction saved successfully!");
  };

  const handleDelete = (id: number) => {
    deleteFromStorage(id);
    setSavedList(loadSavedPredictions());
    toast.success("Prediction deleted");
  };

  const handleViewSaved = (saved: SavedPrediction) => {
    setLocality(saved.locality);
    setPredictions(saved.predictions);
    toast.info(
      `Viewing prediction from ${new Date(saved.created_at).toLocaleDateString()}`,
    );
  };

  const formatLastUpdated = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const showControls = activeNav === "Dashboard" || activeNav === "Forecasting";

  // Controls bar shared across Dashboard and Forecasting
  const ControlsBar = (
    <motion.div
      key="controls"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-2 card-surface px-3 py-2 rounded-lg">
        <MapPin size={14} className="text-electric" />
        <Select value={locality} onValueChange={setLocality}>
          <SelectTrigger
            className="border-0 bg-transparent text-foreground text-sm h-6 w-44 focus:ring-0 p-0"
            data-ocid="controls.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-64 overflow-y-auto">
            {filteredLocalities.map((l) => (
              <SelectItem key={l} value={l} className="text-foreground">
                {l}
              </SelectItem>
            ))}
            {filteredLocalities.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                No cities found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-9 text-sm text-foreground border-border bg-muted/30 hover:bg-muted/60"
        onClick={() => setInputMode(inputMode === "manual" ? "auto" : "manual")}
        data-ocid="controls.secondary_button"
      >
        {inputMode === "manual" ? "Auto Mode" : "Manual Input"}
      </Button>

      <Button
        type="button"
        className={`h-9 text-sm font-medium transition-all ${inputMode === "auto"
          ? "bg-transparent border border-primary text-electric glow-blue hover:bg-primary/10"
          : "bg-transparent border border-border text-muted-foreground hover:border-primary hover:text-electric"
          }`}
        onClick={handleAutoDetect}
        disabled={isDetecting}
        data-ocid="controls.primary_button"
      >
        {isDetecting ? (
          <>
            <span className="mr-2 h-3 w-3 rounded-full border-2 border-electric border-t-transparent animate-spin" />
            Detecting...
          </>
        ) : (
          <>
            <Navigation size={14} className="mr-1.5" />
            Auto-Detect
          </>
        )}
      </Button>

      <div className="flex items-center gap-2 card-surface px-3 py-2 rounded-lg ml-auto">
        <span className="text-xs text-muted-foreground">5-day view</span>
        <ChevronDown size={13} className="text-muted-foreground" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
            <Zap
              size={20}
              className="text-electric"
              style={{ filter: "drop-shadow(0 0 6px rgba(74,163,255,0.8))" }}
            />
            <span className="text-sm font-bold tracking-wider text-foreground">
              VOLTFORECAST
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ label, icon: Icon }) => (
              <button
                type="button"
                key={label}
                onClick={() => setActiveNav(label)}
                data-ocid={`nav.${label.toLowerCase()}.link`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all ${activeNav === label
                  ? "text-electric bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {/* City Search */}
            <div className="hidden sm:flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 h-8 focus-within:border-electric/50 transition-colors">
              <Search size={13} className="text-muted-foreground" />
              <input
                className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-36"
                placeholder="Search cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                data-ocid="header.search_input"
              />
              {citySearch && (
                <button
                  type="button"
                  onClick={() => setCitySearch("")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="header.search_input"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Analyst Badge */}
            <div className="relative" ref={analystRef}>
              <button
                type="button"
                onClick={() => setAnalystOpen((o) => !o)}
                data-ocid="analyst.toggle"
                className="flex items-center gap-2 bg-muted/50 border border-border hover:border-electric/50 rounded-full px-3 py-1.5 transition-all"
              >
                <User size={13} className="text-muted-foreground" />
                <span className="text-xs text-foreground">Analyst</span>
                <ChevronDown
                  size={11}
                  className={`text-muted-foreground transition-transform ${analystOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              <AnimatePresence>
                {analystOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    data-ocid="analyst.popover"
                    className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-4 z-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={16} className="text-electric" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Grid Analyst
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Energy Forecasting
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Region
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          India
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Cities
                        </span>
                        <span className="text-xs font-medium text-electric">
                          {LOCALITIES.length}+
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Data Range
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          2021–2026
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border">
                      <span className="inline-flex items-center gap-1.5 text-xs text-teal">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        ML Model Active
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Page title row */}
        <motion.div
          key={`${activeNav}-title`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {activeNav}{" "}
              <span className="text-muted-foreground font-normal">|</span>{" "}
              <span className="text-electric">{locality}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeNav === "Dashboard" &&
                "Electricity demand overview powered by ML"}
              {activeNav === "Forecasting" &&
                "5-day electricity consumption forecast"}
              {activeNav === "Historical" &&
                "Historical demand trends and analysis"}
              {activeNav === "Reports" &&
                "Saved predictions and summary reports"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
              <span className="text-xs font-medium text-teal">ML Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>Updated {formatLastUpdated(lastUpdated)}</span>
            </div>
          </div>
        </motion.div>

        {/* Controls Bar - only on Dashboard and Forecasting */}
        <AnimatePresence mode="wait">
          {showControls && ControlsBar}
        </AnimatePresence>

        {/* Manual Weather Input */}
        <AnimatePresence>
          {showControls && inputMode === "manual" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ManualWeatherInput
                weather={weather}
                onChange={handleWeatherChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* === DASHBOARD VIEW === */}
        <AnimatePresence mode="wait">
          {activeNav === "Dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <KPICards
                todayPrediction={predictions[0] ?? null}
                localityStats={localityStats}
              />
              {predictions.length > 0 && (
                <EnergySourceRecommendation predictions={predictions} />
              )}
              {predictions.length > 0 ? (
                <ForecastChart
                  predictions={predictions}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              ) : (
                <div
                  className="card-surface p-12 flex items-center justify-center"
                  data-ocid="forecast.loading_state"
                >
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Running ML model...
                    </p>
                  </div>
                </div>
              )}
              <HistoricalChart
                records={historicalData}
                localityStats={localityStats}
              />
            </motion.div>
          )}

          {/* === FORECASTING VIEW === */}
          {activeNav === "Forecasting" && (
            <motion.div
              key="forecasting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {predictions.length > 0 && (
                <EnergySourceRecommendation predictions={predictions} />
              )}
              {predictions.length > 0 ? (
                <ForecastChart
                  predictions={predictions}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              ) : (
                <div
                  className="card-surface p-12 flex items-center justify-center"
                  data-ocid="forecast.loading_state"
                >
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Running ML model...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* === HISTORICAL VIEW === */}
          {activeNav === "Historical" && (
            <motion.div
              key="historical"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoricalChart
                records={historicalData}
                localityStats={localityStats}
              />
            </motion.div>
          )}

          {/* === REPORTS VIEW === */}
          {activeNav === "Reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* All saved predictions panel */}
              <SavedPredictionsPanel
                predictions={savedList.filter((s) => s.locality === locality)}
                onDelete={handleDelete}
                onView={handleViewSaved}
              />

              {/* Summary table */}
              <div className="card-surface rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    All Saved Predictions
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Across all cities
                  </p>
                </div>
                {savedList.length === 0 ? (
                  <div
                    className="p-10 text-center"
                    data-ocid="reports.empty_state"
                  >
                    <Activity
                      size={28}
                      className="text-muted-foreground mx-auto mb-3 opacity-40"
                    />
                    <p className="text-sm text-muted-foreground">
                      No saved predictions yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-70">
                      Save forecasts from the Dashboard or Forecasting tab
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" data-ocid="reports.table">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                            #
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                            City
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                            Saved On
                          </th>
                          <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">
                            Peak Demand
                          </th>
                          <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">
                            Days
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedList.map((s, idx) => {
                          const peak = Math.max(
                            ...s.predictions.map((p) => p.demand_mw),
                          );
                          return (
                            <tr
                              key={s.id}
                              data-ocid={`reports.row.${idx + 1}`}
                              className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                              onClick={() => handleViewSaved(s)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleViewSaved(s)
                              }
                              tabIndex={0}
                            >
                              <td className="px-5 py-3 text-xs text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="px-5 py-3 text-sm text-foreground font-medium">
                                {s.locality}
                              </td>
                              <td className="px-5 py-3 text-xs text-muted-foreground">
                                {new Date(s.created_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-semibold text-electric">
                                {peak.toFixed(0)} MW
                              </td>
                              <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                                {s.predictions.length}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-electric" />
                <span className="text-sm font-bold">VOLTFORECAST</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ML-powered electricity demand forecasting for grid operators,
                energy managers, and urban planners across India.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-3">
                Data Coverage
              </h4>
              <ul className="space-y-1">
                {[
                  "Jan 2021 – Mar 2026",
                  `${LOCALITIES.length}+ Indian cities`,
                  "Daily historical records",
                  "Weather-correlated ML",
                ].map((item) => (
                  <li key={item} className="text-xs text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-3">
                Localities
              </h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {LOCALITIES.map((l) => (
                  <li key={l} className="text-xs text-muted-foreground">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}. Built with ❤️{" "}
              <a
                href={`https://voltforecast.ai?utm_source=voltforecast-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                className="text-electric hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                voltforecast
              </a>
            </p>
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-electric" />
              <span className="text-xs text-muted-foreground">
                Powered by multivariate ML regression
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
