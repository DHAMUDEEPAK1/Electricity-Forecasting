import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Tuple
import math
from datetime import datetime, timedelta


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer("pe", pe)

    def forward(self, x):
        return x + self.pe[:, : x.size(1)]


class iTransformerBlock(nn.Module):
    def __init__(self, d_model: int, n_heads: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.attention = nn.MultiheadAttention(
            d_model, n_heads, dropout=dropout, batch_first=True
        )
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout),
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        attn_out, _ = self.attention(x, x, x, attn_mask=mask)
        x = self.norm1(x + self.dropout(attn_out))
        ff_out = self.ff(x)
        x = self.norm2(x + ff_out)
        return x


class iTransformerModel(nn.Module):
    def __init__(
        self,
        input_dim: int = 4,
        d_model: int = 128,
        n_heads: int = 8,
        d_ff: int = 512,
        n_layers: int = 4,
        dropout: float = 0.1,
        pred_len: int = 5,
    ):
        super().__init__()
        self.pred_len = pred_len
        self.d_model = d_model

        self.input_projection = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model)

        self.transformer_blocks = nn.ModuleList(
            [
                iTransformerBlock(d_model, n_heads, d_ff, dropout)
                for _ in range(n_layers)
            ]
        )

        self.output_projection = nn.Linear(d_model, 1)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        x = self.input_projection(x)
        x = self.pos_encoder(x)
        x = self.dropout(x)

        for block in self.transformer_blocks:
            x = block(x)

        predictions = self.output_projection(x[:, -self.pred_len :, :])
        return predictions.squeeze(-1)


class ElectricityForecaster:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.scaler_mean = None
        self.scaler_std = None

    def _create_sequences(
        self, data: np.ndarray, seq_len: int = 30
    ) -> Tuple[np.ndarray, np.ndarray]:
        X, y = [], []
        for i in range(len(data) - seq_len):
            X.append(data[i : i + seq_len])
            y.append(data[i + seq_len : i + seq_len + 5, 0])
        return np.array(X), np.array(y)

    def _normalize(self, data: np.ndarray) -> Tuple[np.ndarray, Dict]:
        self.scaler_mean = np.mean(data, axis=0)
        self.scaler_std = np.std(data, axis=0) + 1e-8
        return (data - self.scaler_mean) / self.scaler_std, {
            "mean": self.scaler_mean,
            "std": self.scaler_std,
        }

    def _denormalize(self, data: np.ndarray) -> np.ndarray:
        return data * self.scaler_std[0] + self.scaler_mean[0]

    def train(self, historical_data: List[Dict], epochs: int = 50):
        if len(historical_data) < 30:
            return None

        demand = np.array(
            [
                [r["demand_mw"], r["temperature"], r["humidity"], r["wind_speed"]]
                for r in historical_data
            ],
            dtype=np.float32,
        )

        demand_norm, scaler_params = self._normalize(demand)

        X, y = self._create_sequences(demand_norm, seq_len=30)

        if len(X) < 10:
            return None

        X_tensor = torch.FloatTensor(X).to(self.device)
        y_tensor = torch.FloatTensor(y).to(self.device)

        self.model = iTransformerModel(
            input_dim=4,
            d_model=64,
            n_heads=4,
            d_ff=256,
            n_layers=2,
            dropout=0.1,
            pred_len=5,
        ).to(self.device)

        optimizer = torch.optim.AdamW(self.model.parameters(), lr=0.001)
        criterion = nn.MSELoss()

        self.model.train()
        batch_size = 32
        for epoch in range(epochs):
            total_loss = 0
            n_batches = 0

            for i in range(0, len(X_tensor), batch_size):
                batch_x = X_tensor[i : i + batch_size]
                batch_y = y_tensor[i : i + batch_size]

                optimizer.zero_grad()
                predictions = self.model(batch_x)
                loss = criterion(predictions, batch_y)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                optimizer.step()

                total_loss += loss.item()
                n_batches += 1

            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch + 1}/{epochs}, Loss: {total_loss / n_batches:.4f}")

        return self

    def predict(
        self, weather_inputs: List[Dict], historical_data: List[Dict]
    ) -> List[Dict]:
        if self.model is None or len(historical_data) < 30:
            return self._fallback_predict(weather_inputs, historical_data)

        self.model.eval()

        recent_demand = np.array(
            [
                [r["demand_mw"], r["temperature"], r["humidity"], r["wind_speed"]]
                for r in historical_data[-30:]
            ],
            dtype=np.float32,
        )

        demand_norm = (recent_demand - self.scaler_mean) / self.scaler_std

        weather_array = np.array(
            [
                [w["temperature"], w["humidity"], w["wind_speed"], 0]
                for w in weather_inputs[:5]
            ],
            dtype=np.float32,
        )

        weather_norm = (weather_array - self.scaler_mean[1:]) / self.scaler_std[1:]

        combined = np.zeros((30 + 5, 4), dtype=np.float32)
        combined[:30, 0] = demand_norm[:, 0]
        combined[:30, 1:] = demand_norm[:, 1:]
        combined[30:, 1:] = weather_norm

        predictions = []

        with torch.no_grad():
            for i in range(5):
                input_seq = (
                    torch.FloatTensor(combined[i : i + 30]).unsqueeze(0).to(self.device)
                )
                pred = self.model(input_seq)
                pred_val = pred[0, i].item() * self.scaler_std[0] + self.scaler_mean[0]
                predictions.append(max(500, round(pred_val)))

        return self._format_predictions(predictions, weather_inputs)

    def _fallback_predict(
        self, weather_inputs: List[Dict], historical_data: List[Dict]
    ) -> List[Dict]:
        if not historical_data:
            return self._format_predictions([3000] * 5, weather_inputs)

        demands = [r["demand_mw"] for r in historical_data]
        avg_demand = sum(demands) / len(demands)

        predictions = []
        for i, weather in enumerate(weather_inputs[:5]):
            temp_factor = (weather["temperature"] - 25) * 30
            humid_factor = (weather["humidity"] - 60) * 5
            wind_factor = -weather["wind_speed"] * 10

            demand = avg_demand + temp_factor + humid_factor + wind_factor
            predictions.append(max(500, round(demand)))

        return self._format_predictions(predictions, weather_inputs)

    def _format_predictions(
        self, demands: List[int], weather_inputs: List[Dict]
    ) -> List[Dict]:
        from datetime import datetime, timedelta

        results = []
        confidence_bands = [0.08, 0.12, 0.15, 0.15, 0.15]

        today = datetime.now()
        for i in range(5):
            d = today + timedelta(days=i + 1)
            weather = (
                weather_inputs[i] if i < len(weather_inputs) else weather_inputs[-1]
            )

            demand_mw = demands[i] if i < len(demands) else demands[-1]
            band = confidence_bands[i]

            weather_condition = self._infer_weather_condition(
                weather["temperature"], weather["humidity"], weather["wind_speed"]
            )

            results.append(
                {
                    "date": d.strftime("%Y-%m-%d"),
                    "demand_mw": demand_mw,
                    "confidence": round((1 - band) * 100),
                    "temperature": weather["temperature"],
                    "humidity": weather["humidity"],
                    "wind_speed": weather["wind_speed"],
                    "upper_bound": round(demand_mw * (1 + band)),
                    "lower_bound": round(demand_mw * (1 - band)),
                    "historical_avg": demand_mw,
                    "weather_condition": weather_condition,
                }
            )

        return results

    def _infer_weather_condition(
        self, temp: float, humidity: float, wind_speed: float
    ) -> str:
        if wind_speed > 30:
            return "stormy"
        if humidity > 80 and wind_speed > 15:
            return "rainy"
        if humidity > 75:
            return "cloudy"
        if wind_speed > 20:
            return "windy"
        return "sunny"


_model_cache = {}


def get_forecaster(locality: str, historical_data: List[Dict]) -> ElectricityForecaster:
    if locality in _model_cache:
        return _model_cache[locality]

    forecaster = ElectricityForecaster()
    forecaster.train(historical_data, epochs=30)
    _model_cache[locality] = forecaster

    return forecaster


def predict_5_days(
    locality: str, weather_inputs: List[Dict], historical_data: List[Dict]
) -> List[Dict]:
    forecaster = get_forecaster(locality, historical_data)
    return forecaster.predict(weather_inputs, historical_data)


def get_default_weather(historical_data: List[Dict], days_ahead: int = 5) -> List[Dict]:
    from datetime import datetime

    results = []
    today = datetime.now()

    for i in range(days_ahead):
        d = today + timedelta(days=i + 1)
        month = d.month

        same_month = [
            r for r in historical_data if int(r["date"].split("-")[1]) == month
        ]

        if same_month:
            results.append(
                {
                    "temperature": round(
                        sum(r["temperature"] for r in same_month) / len(same_month), 1
                    ),
                    "humidity": round(
                        sum(r["humidity"] for r in same_month) / len(same_month)
                    ),
                    "wind_speed": round(
                        sum(r["wind_speed"] for r in same_month) / len(same_month), 1
                    ),
                }
            )
        else:
            results.append({"temperature": 20, "humidity": 60, "wind_speed": 12})

    return results


def detect_location_weather(lat: float, lng: float) -> Dict:
    from datetime import datetime

    today = datetime.now()
    month = today.month
    seasonal_temp = math.sin(((month - 2) * math.pi) / 6) * 12
    base_temp = 28 - (lat - 30) * 0.7 if lat > 30 else 28

    return {
        "temperature": round((base_temp + seasonal_temp) * 10) / 10,
        "humidity": round(60 + math.sin((month * math.pi) / 3) * 15),
        "wind_speed": round((10 + abs(lng) * 0.02) * 10) / 10,
    }
