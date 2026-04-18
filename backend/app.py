from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app)

# Load PCOS model
model = joblib.load("pcos_phase1_model.pkl")


def yes_no_to_int(value):
    if isinstance(value, str):
        return 1 if value.lower() == "yes" else 0
    return int(value)


# ---------------- PCOS PREDICTION ---------------- #

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.json
        print("PCOS Data:", data)

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
        bmi = weight / (height_m ** 2)
        whr = waist / hip

        input_df = pd.DataFrame({

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
            "Reg.Exercise(Y/N)": [exercise]

        })

        probability = model.predict_proba(input_df)[0][1]
        risk_percentage = round(float(probability) * 100, 2)

        if risk_percentage < 30:
            risk_level = "Low"
            recommendation = "Maintain healthy lifestyle."

        elif risk_percentage < 60:
            risk_level = "Moderate"
            recommendation = "Monitor symptoms and improve lifestyle."

        else:
            risk_level = "High"
            recommendation = "High PCOS risk. Consult a gynecologist."

        return jsonify({

            "risk": risk_percentage,
            "level": risk_level,
            "recommendation": recommendation

        })

    except Exception as e:

        return jsonify({"error": str(e)}), 400


# ---------------- THYROID PREDICTION ---------------- #

@app.route("/predict-thyroid", methods=["POST"])
def predict_thyroid():

    try:

        data = request.json
        print("Thyroid Data:", data)

        weight = float(data["weight"])
        height = float(data["height"])
        sleep = float(data["sleep"])

        fatigue = int(data["fatigue"])
        dry_skin = int(data["dry_skin"])
        cold = int(data["cold"])
        heat = int(data["heat"])
        hair_loss = int(data["hair_loss"])
        weight_gain = int(data["weight_gain"])

        # Simple risk score (replace with ML later)

        score = fatigue + dry_skin + cold + heat + hair_loss + weight_gain

        thyroid_risk = round((score / 6) * 100, 2)

        if thyroid_risk < 30:
            level = "Low"
            rec = "Low thyroid risk. Maintain healthy lifestyle."

        elif thyroid_risk < 60:
            level = "Moderate"
            rec = "Moderate thyroid risk. Monitor symptoms."

        else:
            level = "High"
            rec = "High thyroid risk detected. Please consult a doctor."

        return jsonify({

            "risk": thyroid_risk,
            "level": level,
            "recommendation": rec

        })

    except Exception as e:

        return jsonify({"error": str(e)}), 400


@app.route("/")
def home():

    return "PCOS + Thyroid Backend Running 🚀"


if __name__ == "__main__":

    app.run(debug=True)