import pandas as pd
import joblib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        # Resolve absolute path to the models folder
        base_dir = Path(__file__).resolve().parent.parent
        models_dir = base_dir / "ml_models"
        
        try:
            self.phase1_model = joblib.load(models_dir / "pcos_phase1_model.pkl")
            logger.info("✅ PCOS Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            self.phase1_model = None

    @staticmethod
    def _yes_no_to_int(value) -> int:
        if isinstance(value, str):
            return 1 if value.lower() in ["yes", "y", "true"] else 0
        return int(value)

    # ---------------- PCOS PREDICTION ---------------- #
    def predict_pcos(self, data: dict) -> dict:
        if not self.phase1_model:
            raise RuntimeError("PCOS model is not loaded in memory.")

        # Calculate derived metrics
        height_m = data["height"] / 100
        bmi = data["weight"] / (height_m ** 2)
        whr = data["waist"] / data["hip"]

        # Create DataFrame ensuring column names match the trained model
        input_df = pd.DataFrame({
            "Age (yrs)": [data["age"]],
            "BMI": [bmi],
            "WHR": [whr],
            "Cycle(R/I)": [self._yes_no_to_int(data["cycle"])],
            "Cycle length(days)": [data["cycle_length"]],
            "Weight gain(Y/N)": [self._yes_no_to_int(data["weight_gain"])],
            "hair growth(Y/N)": [self._yes_no_to_int(data["hair_growth"])],
            "Hair loss(Y/N)": [self._yes_no_to_int(data["hair_loss"])],
            "Pimples(Y/N)": [self._yes_no_to_int(data["pimples"])],
            "Fast food (Y/N)": [self._yes_no_to_int(data["fast_food"])],
            "Reg.Exercise(Y/N)": [self._yes_no_to_int(data["exercise"])]
        })

        # Get probability
        probability = self.phase1_model.predict_proba(input_df)[0][1]
        risk_percentage = round(float(probability) * 100, 2)

        # Risk classification
        if risk_percentage < 35:
            risk_level = "Low"
            recommendation = "Maintain a healthy lifestyle with a balanced diet and regular exercise."
        elif risk_percentage < 60 and risk_percentage >= 35:
            risk_level = "Moderate"
            recommendation = "Consider improving lifestyle habits and monitor symptoms. A medical consultation may help."
        else:
            risk_level = "High"
            recommendation = "High PCOS risk detected. Please consult a gynecologist or healthcare professional."

        return {
            "risk": risk_percentage,
            "level": risk_level,
            "recommendation": recommendation
        }

    # ---------------- THYROID PREDICTION ---------------- #
    def predict_thyroid(self, data: dict) -> dict:
        # Simple risk score heuristic 
        score = (
            data["fatigue"] + 
            data["dry_skin"] + 
            data["cold"] + 
            data["heat"] + 
            data["hair_loss"] + 
            data["weight_gain"]
        )

        thyroid_risk = round((score / 6) * 100, 2)

        if thyroid_risk < 30:
            level = "Low"
            rec = "Low thyroid risk. Maintain a healthy lifestyle."
        elif thyroid_risk < 60:
            level = "Moderate"
            rec = "Moderate thyroid risk. Monitor symptoms."
        else:
            level = "High"
            rec = "High thyroid risk detected. Please consult a doctor."

        return {
            "risk": thyroid_risk,
            "level": level,
            "recommendation": rec
        }

# Singleton instance
ml_service = MLService()
# import pandas as pd
# import joblib
# from pathlib import Path
# import logging

# logger = logging.getLogger(__name__)

# class MLService:
#     def __init__(self):
#         # Resolve absolute path to the models folder
#         base_dir = Path(__file__).resolve().parent.parent
#         models_dir = base_dir / "ml_models"
        
#         # Load ALL .pkl files into memory once at startup
#         try:
#             self.phase1_model = joblib.load(models_dir / "pcos_phase1_model.pkl")
#             self.stage1_model = joblib.load(models_dir / "pcos_stage1_model.pkl")
#             self.pipeline = joblib.load(models_dir / "pcos_pipeline.pkl")
#             self.scaler_stage1 = joblib.load(models_dir / "scaler_stage1.pkl")
#             logger.info("✅ All ML Models, Pipelines, and Scalers loaded successfully")
#         except Exception as e:
#             logger.error(f"Failed to load one or more ML files: {e}")
#             self.phase1_model = None

#     @staticmethod
#     def _yes_no_to_int(value) -> int:
#         if isinstance(value, str):
#             return 1 if value.lower() in ["yes", "y", "true", "regular"] else 0
#         return int(value)

#     def predict_risk(self, data: dict) -> dict:
#         # We will use phase1_model just like your Flask code did
#         if not self.phase1_model:
#             raise RuntimeError("Primary model is not loaded.")

#         # Calculate derived metrics
#         height_m = data["height"] / 100
#         bmi = data["weight"] / (height_m ** 2)
#         whr = data["waist"] / data["hip"]

#         # Create DataFrame ensuring column names exactly match your trained model
#         input_df = pd.DataFrame({
#             "Age (yrs)": [data["age"]],
#             "BMI": [bmi],
#             "WHR": [whr],
#             "Cycle(R/I)": [self._yes_no_to_int(data["cycle"])],
#             "Cycle length(days)": [data["cycle_length"]],
#             "Weight gain(Y/N)": [self._yes_no_to_int(data["weight_gain"])],
#             "hair growth(Y/N)": [self._yes_no_to_int(data["hair_growth"])],
#             "Hair loss(Y/N)": [self._yes_no_to_int(data["hair_loss"])],
#             "Pimples(Y/N)": [self._yes_no_to_int(data["pimples"])],
#             "Fast food (Y/N)": [self._yes_no_to_int(data["fast_food"])],
#             "Reg.Exercise(Y/N)": [self._yes_no_to_int(data["exercise"])]
#         })

#         # NOTE: If your model was trained WITH a scaler, you would apply it here like this:
#         # scaled_input = self.scaler_stage1.transform(input_df)
#         # probability = self.stage1_model.predict_proba(scaled_input)[0][1]
        
#         # But sticking to your original Flask logic:
#         probability = self.phase1_model.predict_proba(input_df)[0][1]
#         risk_percentage = round(float(probability) * 100, 2)

#         # Risk classification
#         if risk_percentage < 30:
#             risk_level = "Low"
#             recommendation = "Maintain a healthy lifestyle with a balanced diet and regular exercise."
#         elif risk_percentage < 60:
#             risk_level = "Moderate"
#             recommendation = "Consider improving lifestyle habits and monitor symptoms. A medical consultation may help."
#         else:
#             risk_level = "High"
#             recommendation = "High PCOS risk detected. Please consult a gynecologist or healthcare professional."

#         return {
#             "risk": risk_percentage,
#             "level": risk_level,
#             "recommendation": recommendation
#         }

# # Singleton instance
# ml_service = MLService()