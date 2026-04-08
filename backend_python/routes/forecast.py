from flask import Blueprint, request, jsonify
from models.itransformer_model import (
    predict_5_days,
    get_default_weather,
    detect_location_weather,
)
from utils.historical_data import generate_historical_data

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/forecast", methods=["POST"])
def forecast():
    data = request.get_json()

    locality = data.get("locality", "Mumbai, MH")
    weather = data.get("weather", [])

    historical_data = generate_historical_data(locality)

    if not weather:
        weather = get_default_weather(historical_data, 5)

    predictions = predict_5_days(locality, weather, historical_data)

    return jsonify(
        {
            "predictions": predictions,
            "locality": locality,
        }
    )


@forecast_bp.route("/default-weather", methods=["GET"])
def default_weather():
    locality = request.args.get("locality", "Mumbai, MH")
    days = int(request.args.get("days", 5))

    historical_data = generate_historical_data(locality)
    weather = get_default_weather(historical_data, days)

    return jsonify({"weather": weather})


@forecast_bp.route("/detect-weather", methods=["POST"])
def detect_weather():
    data = request.get_json()
    lat = data.get("lat", 0)
    lng = data.get("lng", 0)

    weather = detect_location_weather(lat, lng)

    return jsonify({"weather": weather})
