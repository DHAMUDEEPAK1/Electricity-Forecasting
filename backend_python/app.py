from flask import Flask
from flask_cors import CORS
from routes.forecast import forecast_bp
from routes.localities import localities_bp
from routes.energy import energy_bp
from routes.history import history_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(forecast_bp, url_prefix="/api")
app.register_blueprint(localities_bp, url_prefix="/api")
app.register_blueprint(energy_bp, url_prefix="/api")
app.register_blueprint(history_bp, url_prefix="/api")


@app.route("/api/health")
def health():
    return {"status": "ok", "model": "itransformers"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
