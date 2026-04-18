from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from services.ml_service import ml_service

# All routes in this file will automatically start with /predict
router = APIRouter(prefix="/predict", tags=["ML Prediction"])
logger = logging.getLogger(__name__)

# --- Pydantic Validation Models ---

class PCOSRequest(BaseModel):
    age: float
    height: float
    weight: float
    waist: float
    hip: float
    cycle: str
    cycle_length: float
    weight_gain: str
    hair_growth: str
    hair_loss: str
    pimples: str
    fast_food: str
    exercise: str

class ThyroidRequest(BaseModel):
    weight: float
    height: float
    sleep: float
    fatigue: int
    dry_skin: int
    cold: int
    heat: int
    hair_loss: int
    weight_gain: int

class PredictionResponse(BaseModel):
    risk: float
    level: str
    recommendation: str

# --- Endpoints ---

@router.post("/pcos", response_model=PredictionResponse)
async def predict_pcos_endpoint(request: PCOSRequest):
    """Predicts the likelihood of PCOS based on user biometrics and symptoms."""
    try:
        # Convert the Pydantic object to a standard Python dictionary
        result = ml_service.predict_pcos(request.dict())
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"PCOS Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing PCOS prediction.")

@router.post("/thyroid", response_model=PredictionResponse)
async def predict_thyroid_endpoint(request: ThyroidRequest):
    """Evaluates thyroid risk based on physical symptoms and sleep patterns."""
    try:
        result = ml_service.predict_thyroid(request.dict())
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Thyroid Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing Thyroid prediction.")

# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# import logging
# from app.services.ml_service import ml_service

# router = APIRouter(prefix="/predict", tags=["ML Prediction"])
# logger = logging.getLogger(__name__)

# # This replaces request.json from Flask and automatically validates data types
# class PredictionRequest(BaseModel):
#     age: float
#     height: float
#     weight: float
#     waist: float
#     hip: float
#     cycle: str
#     cycle_length: float
#     weight_gain: str
#     hair_growth: str
#     hair_loss: str
#     pimples: str
#     fast_food: str
#     exercise: str

# class PredictionResponse(BaseModel):
#     risk: float
#     level: str
#     recommendation: str

# @router.post("", response_model=PredictionResponse)
# async def predict_pcos(request: PredictionRequest):
#     try:
#         # Convert Pydantic object to dict and pass to our new ML Service
#         result = ml_service.predict_risk(request.dict())
#         return PredictionResponse(**result)
#     except Exception as e:
#         logger.error(f"Prediction error: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail="Error processing prediction.")