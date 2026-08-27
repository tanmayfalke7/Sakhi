from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.graph_service import graph_service
from services.response_formatter import response_formatter

router = APIRouter(prefix="/meal-plans", tags=["Meal Plans"])


class SymptomRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)


@router.post("/recommend")
async def recommend_meal_plan(request: SymptomRequest):
    plans = await graph_service.get_meal_plan_for_symptoms(request.symptoms)
    if not plans:
        plans = await graph_service.get_default_meal_plans()
    return response_formatter.format_meal_plan_response(plans)


@router.get("/{plan_name}/day/{day}")
async def get_meal_plan_day(plan_name: str, day: int):
    if day < 1 or day > 7:
        raise HTTPException(status_code=400, detail="Day must be between 1 and 7.")

    meals = await graph_service.get_daily_meal(plan_name, day)
    if not meals:
        raise HTTPException(status_code=404, detail="Meal plan day not found.")

    row = meals[0]
    return {
        "success": True,
        "plan": plan_name,
        "day": day,
        "meals": row.get("meals", []),
        "totals": {
            "calories": row.get("total_calories"),
            "protein": row.get("protein"),
            "carbs": row.get("carbs"),
            "fat": row.get("fat"),
        },
    }


@router.get("/{plan_name}/week")
async def get_full_week(plan_name: str):
    week = await graph_service.get_full_week(plan_name)
    if not week["days"]:
        raise HTTPException(status_code=404, detail="Meal plan not found.")
    return {"success": True, **week}
