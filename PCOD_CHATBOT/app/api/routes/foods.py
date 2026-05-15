from fastapi import APIRouter, HTTPException

from services.graph_service import graph_service

router = APIRouter(prefix="/foods", tags=["Foods"])


@router.get("/{food_name}")
async def get_food(food_name: str):
    food = await graph_service.get_food_details(food_name)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found.")
    return {"success": True, "data": food}


@router.get("/symptom/{symptom}/help")
async def foods_that_help(symptom: str):
    foods = await graph_service.get_foods_by_symptom(symptom)
    return {
        "success": True,
        "symptom": symptom,
        "foods": foods,
        "count": len(foods),
        "message": None if foods else "No exact foods found for this symptom yet.",
    }


@router.get("/symptom/{symptom}/avoid")
async def foods_to_avoid(symptom: str):
    foods = await graph_service.get_foods_to_avoid(symptom)
    return {
        "success": True,
        "symptom": symptom,
        "foods_to_avoid": foods,
        "count": len(foods),
        "tip": "Aim for small swaps and sustainable choices.",
    }
