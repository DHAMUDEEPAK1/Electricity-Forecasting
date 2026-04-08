from flask import Blueprint, jsonify
from utils.historical_data import get_localities, get_locality_coords

localities_bp = Blueprint("localities", __name__)


@localities_bp.route("/localities", methods=["GET"])
def get_all_localities():
    localities = get_localities()
    return jsonify({"localities": localities})


@localities_bp.route("/localities/coords", methods=["GET"])
def get_coords():
    coords = get_locality_coords()
    return jsonify({"coords": coords})
