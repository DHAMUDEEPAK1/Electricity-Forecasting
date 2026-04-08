from flask import Blueprint, request, jsonify
from utils.historical_data import generate_historical_data, get_locality_stats

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
def get_history():
    locality = request.args.get("locality", "Mumbai, MH")

    historical_data = generate_historical_data(locality)

    return jsonify(
        {
            "locality": locality,
            "records": historical_data,
        }
    )


@history_bp.route("/history/stats", methods=["GET"])
def get_stats():
    locality = request.args.get("locality", "Mumbai, MH")

    historical_data = generate_historical_data(locality)
    stats = get_locality_stats(historical_data)

    return jsonify(
        {
            "locality": locality,
            "stats": stats,
        }
    )
