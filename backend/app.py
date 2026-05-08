from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "PCOD_CHATBOT" / "app" / "ml_models"
PCOS_MODEL_PATH = MODEL_DIR / "pcos_phase1_model.pkl"

app = Flask(__name__)
CORS(app)

model = joblib.load(PCOS_MODEL_PATH)


def yes_no_to_int(value):
    if isinstance(value, str):
        return 1 if value.lower() == "yes" else 0
    return int(value)


def build_pcos_response(data):
    age = float(data["age"])
    height = float(data["height"])
    weight = float(data["weight"])
    waist = float(data["waist"])
    hip = float(data["hip"])

    cycle = yes_no_to_int(data["cycle"])
    cycle_length = float(data["cycle_length"])

    weight_gain = yes_no_to_int(data["weight_gain"])
    hair_growth = yes_no_to_int(data["hair_growth"])
    hair_loss = yes_no_to_int(data["hair_loss"])
    pimples = yes_no_to_int(data["pimples"])
    fast_food = yes_no_to_int(data["fast_food"])
    exercise = yes_no_to_int(data["exercise"])

    height_m = height / 100
    bmi = weight / (height_m**2)
    whr = waist / hip

    input_df = pd.DataFrame(
        {
            "Age (yrs)": [age],
            "BMI": [bmi],
            "WHR": [whr],
            "Cycle(R/I)": [cycle],
            "Cycle length(days)": [cycle_length],
            "Weight gain(Y/N)": [weight_gain],
            "hair growth(Y/N)": [hair_growth],
            "Hair loss(Y/N)": [hair_loss],
            "Pimples(Y/N)": [pimples],
            "Fast food (Y/N)": [fast_food],
            "Reg.Exercise(Y/N)": [exercise],
        }
    )

    probability = model.predict_proba(input_df)[0][1]
    risk_percentage = round(float(probability) * 100, 2)

    if risk_percentage < 30:
        risk_level = "Low"
        recommendation = "Maintain a healthy lifestyle and continue tracking your symptoms."
    elif risk_percentage < 60:
        risk_level = "Moderate"
        recommendation = "Monitor your symptoms closely and consider a medical consultation."
    else:
        risk_level = "High"
        recommendation = "High PCOS risk detected. Please consult a gynecologist soon."

    return {
        "risk": risk_percentage,
        "level": risk_level,
        "recommendation": recommendation,
    }


def build_thyroid_response(data):
    weight = float(data["weight"])
    height = float(data["height"])
    sleep = float(data["sleep"])

    fatigue = int(data["fatigue"])
    dry_skin = int(data["dry_skin"])
    cold = int(data["cold"])
    heat = int(data["heat"])
    hair_loss = int(data["hair_loss"])
    weight_gain = int(data["weight_gain"])

    score = fatigue + dry_skin + cold + heat + hair_loss + weight_gain
    thyroid_risk = round((score / 6) * 100, 2)

    if thyroid_risk < 30:
        level = "Low"
        rec = "Low thyroid risk. Maintain a healthy routine and keep observing symptoms."
    elif thyroid_risk < 60:
        level = "Moderate"
        rec = "Moderate thyroid risk. Monitor symptoms and seek medical advice if they persist."
    else:
        level = "High"
        rec = "High thyroid risk detected. Please consult a doctor."

    return {
        "risk": thyroid_risk,
        "level": level,
        "recommendation": rec,
        "sleep_hours": sleep,
        "bmi_hint": round(weight / ((height / 100) ** 2), 2),
    }


@app.route("/predict", methods=["POST"])
@app.route("/api/v1/predict/pcos", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        return jsonify(build_pcos_response(data))
    except Exception as error:
        return jsonify({"error": str(error)}), 400


@app.route("/predict-thyroid", methods=["POST"])
@app.route("/api/v1/predict/thyroid", methods=["POST"])
def predict_thyroid():
    try:
        data = request.get_json(force=True)
        return jsonify(build_thyroid_response(data))
    except Exception as error:
        return jsonify({"error": str(error)}), 400


@app.route("/")
def home():
    return "Sakhi ML service is running"


@app.route("/health")
def health():
    return jsonify(
        {
            "success": True,
            "message": "ML service is running",
            "pcos_model": str(PCOS_MODEL_PATH),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
