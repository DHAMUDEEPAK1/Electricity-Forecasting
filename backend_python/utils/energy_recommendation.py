from typing import List, Dict

EnergySource = str

REASON_MAP = {
    "Solar": "Clear skies and optimal temperatures favor solar generation",
    "Wind": "High wind speeds make wind turbines most efficient",
    "Hydro": "High humidity and rainfall indicators support hydro generation",
    "Thermal": "High demand periods call for reliable thermal baseload",
    "Nuclear": "Steady baseload from nuclear suits high-demand conditions",
}


def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))


def score_solar(p: Dict) -> float:
    score = 50
    if p.get("weather_condition") == "sunny":
        score += 35
    elif p.get("weather_condition") == "cloudy":
        score -= 15
    elif p.get("weather_condition") in ["rainy", "stormy"]:
        score -= 30

    temp = p.get("temperature", 25)
    if 25 <= temp <= 40:
        score += 10
    elif temp < 20:
        score -= 10

    humid = p.get("humidity", 60)
    if humid < 40:
        score += 5
    elif humid >= 60:
        score -= 10
    elif humid >= 80:
        score -= 20

    return clamp(score, 0, 100)


def score_wind(p: Dict) -> float:
    score = 30
    wind_speed = p.get("wind_speed", 0)
    score += clamp(wind_speed * 2.5, 0, 55)

    weather = p.get("weather_condition", "")
    if weather == "windy":
        score += 15
    elif weather == "stormy":
        score += 10

    return clamp(score, 0, 100)


def score_hydro(p: Dict) -> float:
    score = 40
    weather = p.get("weather_condition", "")
    if weather == "rainy":
        score += 35
    elif weather == "stormy":
        score += 20

    humid = p.get("humidity", 0)
    if humid > 80:
        score += 15
    elif humid > 70:
        score += 8

    return clamp(score, 0, 100)


def score_thermal(p: Dict) -> float:
    score = 55
    demand = p.get("demand_mw", 0)
    if demand > 4000:
        score += 20
    elif demand > 3000:
        score += 10
    return clamp(score, 0, 100)


def score_nuclear(p: Dict) -> float:
    score = 50
    demand = p.get("demand_mw", 0)
    if demand > 4000:
        score += 15
    elif demand > 3000:
        score += 8
    return clamp(score, 0, 100)


def recommend_energy_source(predictions: List[Dict]) -> Dict:
    energy_sources = ["Solar", "Wind", "Hydro", "Thermal", "Nuclear"]

    daily = []
    for p in predictions:
        scores = {
            "Solar": score_solar(p),
            "Wind": score_wind(p),
            "Hydro": score_hydro(p),
            "Thermal": score_thermal(p),
            "Nuclear": score_nuclear(p),
        }

        best = max(scores, key=scores.get)

        daily.append(
            {
                "date": p["date"],
                "best": best,
                "scores": {k: round(v) for k, v in scores.items()},
                "reason": REASON_MAP[best],
            }
        )

    tally = {src: 0 for src in energy_sources}
    for d in daily:
        tally[d["best"]] += 1

    overall_best = max(tally, key=tally.get)

    return {
        "overallBest": overall_best,
        "overallReason": REASON_MAP[overall_best],
        "daily": daily,
    }
