from flask import Blueprint, request, jsonify
from utils.energy_recommendation import recommend_energy_source

energy_bp = Blueprint("energy", __name__)


@energy_bp.route("/energy-recommend", methods=["POST"])
def energy_recommend():
    data = request.get_json()
    predictions = data.get("predictions", [])

    if not predictions:
        return jsonify({"error": "No predictions provided"}), 400

    result = recommend_energy_source(predictions)

    return jsonify(result)
