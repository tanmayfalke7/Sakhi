from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.graph_service import graph_service

router = APIRouter(prefix="/foods", tags=["Foods"])

class FoodQuery(BaseModel):
    name: str

@router.get("/{food_name}")
async def get_food(food_name: str):
    """Get detailed information about a specific food"""
    food = await graph_service.get_food_details(food_name)
    
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    
    return food

@router.get("/symptom/{symptom}/help")
async def foods_that_help(symptom: str):
    """Get foods that help with a specific symptom"""
    foods = await graph_service.get_foods_by_symptom(symptom)
    
    if not foods:
        return {
            "message": f"✨ I don't have specific foods for '{symptom}' yet, but here are some general anti-inflammatory options!",
            "suggestions": ["Salmon", "Spinach", "Blueberries", "Oats"]
        }
    
    return {
        "symptom": symptom,
        "foods": foods,
        "count": len(foods)
    }

@router.get("/symptom/{symptom}/avoid")
async def foods_to_avoid(symptom: str):
    """Get foods that worsen a specific symptom"""
    foods = await graph_service.get_foods_to_avoid(symptom)
    
    return {
        "symptom": symptom,
        "foods_to_avoid": foods,
        "tip": "Remember love - it's not about perfection, just small swaps! 💕"
    }