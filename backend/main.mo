import Array "mo:base/Array";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Int "mo:base/Int";

actor {
  // --- Types ---
  public type DayPrediction = {
    date: Text;
    demand_mw: Float;
    confidence: Float;
    temperature: Float;
    humidity: Float;
    wind_speed: Float;
  };

  public type SavedPrediction = {
    id: Nat;
    locality: Text;
    created_at: Text;
    predictions: [DayPrediction];
  };

  public type HistoricalRecord = {
    date: Text;
    demand_mw: Float;
    temperature: Float;
    humidity: Float;
    wind_speed: Float;
    locality: Text;
  };

  public type LocalityStats = {
    locality: Text;
    avg_demand: Float;
    peak_demand: Float;
    min_demand: Float;
    data_points: Nat;
  };

  // --- State ---
  stable var savedPredictions: [SavedPrediction] = [];
  stable var nextId: Nat = 1;

  // --- Historical seed data (monthly averages per locality 2021-2026) ---
  let historicalData: [HistoricalRecord] = [
    // Seattle, WA
    {date="2021-01"; demand_mw=8200.0; temperature=4.0; humidity=82.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2021-02"; demand_mw=7900.0; temperature=5.5; humidity=78.0; wind_speed=11.0; locality="Seattle, WA"},
    {date="2021-03"; demand_mw=7500.0; temperature=8.0; humidity=74.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2021-04"; demand_mw=7000.0; temperature=11.0; humidity=70.0; wind_speed=14.0; locality="Seattle, WA"},
    {date="2021-05"; demand_mw=6800.0; temperature=15.0; humidity=65.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2021-06"; demand_mw=6500.0; temperature=19.0; humidity=60.0; wind_speed=11.0; locality="Seattle, WA"},
    {date="2021-07"; demand_mw=7200.0; temperature=23.0; humidity=55.0; wind_speed=10.0; locality="Seattle, WA"},
    {date="2021-08"; demand_mw=7400.0; temperature=22.0; humidity=57.0; wind_speed=10.0; locality="Seattle, WA"},
    {date="2021-09"; demand_mw=6900.0; temperature=18.0; humidity=65.0; wind_speed=11.0; locality="Seattle, WA"},
    {date="2021-10"; demand_mw=7100.0; temperature=12.0; humidity=74.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2021-11"; demand_mw=7700.0; temperature=7.0; humidity=80.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2021-12"; demand_mw=8300.0; temperature=3.0; humidity=85.0; wind_speed=11.0; locality="Seattle, WA"},
    {date="2022-01"; demand_mw=8350.0; temperature=3.5; humidity=83.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2022-04"; demand_mw=7050.0; temperature=11.5; humidity=71.0; wind_speed=14.0; locality="Seattle, WA"},
    {date="2022-07"; demand_mw=7600.0; temperature=24.0; humidity=53.0; wind_speed=9.0; locality="Seattle, WA"},
    {date="2022-10"; demand_mw=7200.0; temperature=11.0; humidity=76.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2022-12"; demand_mw=8500.0; temperature=2.5; humidity=86.0; wind_speed=11.0; locality="Seattle, WA"},
    {date="2023-01"; demand_mw=8600.0; temperature=2.0; humidity=84.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2023-04"; demand_mw=7100.0; temperature=12.0; humidity=69.0; wind_speed=14.0; locality="Seattle, WA"},
    {date="2023-07"; demand_mw=7800.0; temperature=25.0; humidity=51.0; wind_speed=9.0; locality="Seattle, WA"},
    {date="2023-10"; demand_mw=7300.0; temperature=11.5; humidity=75.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2023-12"; demand_mw=8700.0; temperature=2.0; humidity=87.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2024-01"; demand_mw=8750.0; temperature=1.5; humidity=85.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2024-06"; demand_mw=6700.0; temperature=20.0; humidity=58.0; wind_speed=10.0; locality="Seattle, WA"},
    {date="2024-12"; demand_mw=8900.0; temperature=1.0; humidity=88.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2025-01"; demand_mw=8950.0; temperature=1.0; humidity=86.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2025-06"; demand_mw=6900.0; temperature=21.0; humidity=56.0; wind_speed=10.0; locality="Seattle, WA"},
    {date="2025-12"; demand_mw=9100.0; temperature=0.5; humidity=89.0; wind_speed=12.0; locality="Seattle, WA"},
    {date="2026-01"; demand_mw=9150.0; temperature=0.5; humidity=87.0; wind_speed=13.0; locality="Seattle, WA"},
    {date="2026-03"; demand_mw=7600.0; temperature=9.0; humidity=75.0; wind_speed=13.0; locality="Seattle, WA"},
    // New York, NY
    {date="2021-01"; demand_mw=11500.0; temperature=-1.0; humidity=65.0; wind_speed=18.0; locality="New York, NY"},
    {date="2021-04"; demand_mw=9800.0; temperature=13.0; humidity=62.0; wind_speed=16.0; locality="New York, NY"},
    {date="2021-07"; demand_mw=13500.0; temperature=29.0; humidity=72.0; wind_speed=12.0; locality="New York, NY"},
    {date="2021-10"; demand_mw=10200.0; temperature=15.0; humidity=68.0; wind_speed=15.0; locality="New York, NY"},
    {date="2021-12"; demand_mw=12000.0; temperature=1.0; humidity=67.0; wind_speed=17.0; locality="New York, NY"},
    {date="2022-01"; demand_mw=11800.0; temperature=-2.0; humidity=66.0; wind_speed=18.0; locality="New York, NY"},
    {date="2022-07"; demand_mw=14000.0; temperature=30.0; humidity=73.0; wind_speed=11.0; locality="New York, NY"},
    {date="2022-12"; demand_mw=12200.0; temperature=0.5; humidity=68.0; wind_speed=17.0; locality="New York, NY"},
    {date="2023-07"; demand_mw=14500.0; temperature=31.0; humidity=74.0; wind_speed=11.0; locality="New York, NY"},
    {date="2023-12"; demand_mw=12500.0; temperature=-0.5; humidity=69.0; wind_speed=18.0; locality="New York, NY"},
    {date="2024-07"; demand_mw=15000.0; temperature=32.0; humidity=75.0; wind_speed=10.0; locality="New York, NY"},
    {date="2024-12"; demand_mw=12800.0; temperature=-1.0; humidity=70.0; wind_speed=18.0; locality="New York, NY"},
    {date="2025-07"; demand_mw=15500.0; temperature=33.0; humidity=76.0; wind_speed=10.0; locality="New York, NY"},
    {date="2026-03"; demand_mw=10500.0; temperature=10.0; humidity=65.0; wind_speed=16.0; locality="New York, NY"},
    // Austin, TX
    {date="2021-01"; demand_mw=9000.0; temperature=8.0; humidity=60.0; wind_speed=14.0; locality="Austin, TX"},
    {date="2021-07"; demand_mw=16000.0; temperature=36.0; humidity=55.0; wind_speed=10.0; locality="Austin, TX"},
    {date="2021-12"; demand_mw=9500.0; temperature=10.0; humidity=58.0; wind_speed=13.0; locality="Austin, TX"},
    {date="2022-07"; demand_mw=17000.0; temperature=38.0; humidity=53.0; wind_speed=9.0; locality="Austin, TX"},
    {date="2023-07"; demand_mw=17500.0; temperature=39.0; humidity=52.0; wind_speed=9.0; locality="Austin, TX"},
    {date="2024-07"; demand_mw=18000.0; temperature=40.0; humidity=51.0; wind_speed=8.0; locality="Austin, TX"},
    {date="2025-07"; demand_mw=18500.0; temperature=41.0; humidity=50.0; wind_speed=8.0; locality="Austin, TX"},
    {date="2026-03"; demand_mw=10000.0; temperature=18.0; humidity=62.0; wind_speed=13.0; locality="Austin, TX"},
    // London, UK
    {date="2021-01"; demand_mw=38000.0; temperature=4.0; humidity=80.0; wind_speed=20.0; locality="London, UK"},
    {date="2021-07"; demand_mw=28000.0; temperature=21.0; humidity=60.0; wind_speed=14.0; locality="London, UK"},
    {date="2021-12"; demand_mw=40000.0; temperature=3.0; humidity=82.0; wind_speed=19.0; locality="London, UK"},
    {date="2022-07"; demand_mw=27000.0; temperature=24.0; humidity=58.0; wind_speed=13.0; locality="London, UK"},
    {date="2023-07"; demand_mw=26500.0; temperature=22.0; humidity=59.0; wind_speed=14.0; locality="London, UK"},
    {date="2024-07"; demand_mw=26000.0; temperature=23.0; humidity=57.0; wind_speed=13.0; locality="London, UK"},
    {date="2025-12"; demand_mw=39000.0; temperature=2.5; humidity=83.0; wind_speed=20.0; locality="London, UK"},
    {date="2026-03"; demand_mw=35000.0; temperature=8.0; humidity=77.0; wind_speed=18.0; locality="London, UK"},
    // Mumbai, India
    {date="2021-01"; demand_mw=3200.0; temperature=24.0; humidity=72.0; wind_speed=8.0; locality="Mumbai, India"},
    {date="2021-05"; demand_mw=4500.0; temperature=33.0; humidity=78.0; wind_speed=12.0; locality="Mumbai, India"},
    {date="2021-07"; demand_mw=3800.0; temperature=29.0; humidity=92.0; wind_speed=18.0; locality="Mumbai, India"},
    {date="2021-12"; demand_mw=3100.0; temperature=23.0; humidity=70.0; wind_speed=8.0; locality="Mumbai, India"},
    {date="2022-05"; demand_mw=4700.0; temperature=34.0; humidity=79.0; wind_speed=12.0; locality="Mumbai, India"},
    {date="2023-05"; demand_mw=4900.0; temperature=35.0; humidity=80.0; wind_speed=12.0; locality="Mumbai, India"},
    {date="2024-05"; demand_mw=5100.0; temperature=36.0; humidity=81.0; wind_speed=13.0; locality="Mumbai, India"},
    {date="2025-05"; demand_mw=5300.0; temperature=37.0; humidity=82.0; wind_speed=13.0; locality="Mumbai, India"},
    {date="2026-03"; demand_mw=3500.0; temperature=28.0; humidity=74.0; wind_speed=9.0; locality="Mumbai, India"}
  ];

  // --- Queries ---
  public query func getHistoricalData(locality: Text) : async [HistoricalRecord] {
    Array.filter(historicalData, func(r: HistoricalRecord): Bool {
      r.locality == locality
    })
  };

  public query func getAllLocalities() : async [Text] {
    ["Seattle, WA", "New York, NY", "Austin, TX", "London, UK", "Mumbai, India"]
  };

  public query func getLocalityStats(locality: Text) : async ?LocalityStats {
    let records = Array.filter(historicalData, func(r: HistoricalRecord): Bool {
      r.locality == locality
    });
    if (records.size() == 0) return null;
    var total = 0.0;
    var peak = 0.0;
    var minD = 999999.0;
    for (r in records.vals()) {
      total += r.demand_mw;
      if (r.demand_mw > peak) peak := r.demand_mw;
      if (r.demand_mw < minD) minD := r.demand_mw;
    };
    ?{
      locality = locality;
      avg_demand = total / Float.fromInt(records.size());
      peak_demand = peak;
      min_demand = minD;
      data_points = records.size();
    }
  };

  public query func getSavedPredictions(locality: Text) : async [SavedPrediction] {
    Array.filter(savedPredictions, func(p: SavedPrediction): Bool {
      p.locality == locality
    })
  };

  // --- Updates ---
  public func savePrediction(locality: Text, created_at: Text, predictions: [DayPrediction]) : async Nat {
    let id = nextId;
    nextId += 1;
    let entry: SavedPrediction = { id; locality; created_at; predictions };
    savedPredictions := Array.append(savedPredictions, [entry]);
    id
  };

  public func deletePrediction(id: Nat) : async Bool {
    let before = savedPredictions.size();
    savedPredictions := Array.filter(savedPredictions, func(p: SavedPrediction): Bool {
      p.id != id
    });
    savedPredictions.size() < before
  };
}
