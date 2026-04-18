from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from services.graph_service import graph_service
from services.response_formatter import response_formatter

router = APIRouter(prefix="/meal-plans", tags=["Meal Plans"])

class SymptomRequest(BaseModel):
    symptoms: List[str]

class MealPlanDayRequest(BaseModel):
    plan_name: str
    day: int

@router.post("/recommend")
async def recommend_meal_plan(request: SymptomRequest):
    """Recommend meal plans based on symptoms"""
    plans = await graph_service.get_meal_plan_for_symptoms(request.symptoms)
    
    if not plans:
        return {
            "message": "🌸 I couldn't find a perfect match, but here's our most popular plan!",
            "plans": await graph_service.get_meal_plan_for_symptoms(["Insulin Resistance"])
        }
    
    formatted = response_formatter.format_meal_plan_response(plans)
    return formatted

@router.get("/{plan_name}/day/{day}")
async def get_meal_plan_day(plan_name: str, day: int):
    """Get a specific day from a meal plan"""
    meals = await graph_service.get_daily_meal(plan_name, day)
    
    if not meals:
        raise HTTPException(status_code=404, detail="Meal plan day not found")
    
    return {
        "plan": plan_name,
        "day": day,
        "meals": meals[0].get("meals", []),
        "totals": {
            "calories": meals[0].get("total_calories"),
            "protein": meals[0].get("protein"),
            "carbs": meals[0].get("carbs"),
            "fat": meals[0].get("fat")
        }
    }

@router.get("/{plan_name}/week")
async def get_full_week(plan_name: str):
    """Get entire week of a meal plan"""
    days = []
    for day in range(1, 8):  # Assuming 7-day plans
        meals = await graph_service.get_daily_meal(plan_name, day)
        if meals:
            days.append({
                "day": day,
                "meals": meals[0].get("meals", [])
            })
    
    return {
        "plan": plan_name,
        "days": days
    }