import json
import re
from typing import Any, Dict, List


class ResponseFormatter:
    @staticmethod
    def format_chat_response(llm_response: str, graph_data: Any = None) -> Dict:
        text = ResponseFormatter._unwrap_text_response(llm_response)
        food_mentions = ResponseFormatter._extract_food_mentions(text)
        has_meal_plan = any(isinstance(item, dict) and item.get("plan_name") for item in (graph_data or []))

        return {
            "success": True,
            "response": text,
            "metadata": {
                "has_sections": bool(re.search(r"(^|\n)\s*(\d+\.|Day\s+\d+)", text, re.IGNORECASE)),
                "food_mentions": food_mentions[:5],
                "has_meal_plan": has_meal_plan,
            },
            "suggested_actions": ResponseFormatter._get_suggested_actions(text, has_meal_plan),
            "graph_data": graph_data or [],
        }

    @staticmethod
    def _extract_food_mentions(text: str) -> list:
        common_foods = [
            "oats",
            "salmon",
            "spinach",
            "eggs",
            "berries",
            "avocado",
            "nuts",
            "quinoa",
            "lentils",
            "kale",
            "apple",
            "chia",
        ]
        lower_text = text.lower()
        return [food.title() for food in common_foods if food in lower_text]

    @staticmethod
    def _unwrap_text_response(value: Any) -> str:
        text = str(value or "").strip()
        if not text:
            return ""

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text).strip()

        if text.startswith("{") and text.endswith("}"):
            try:
                parsed = json.loads(text)
                if isinstance(parsed, dict):
                    return str(parsed.get("answer") or parsed.get("response") or parsed.get("message") or text).strip()
            except json.JSONDecodeError:
                return text

        return text

    @staticmethod
    def _get_suggested_actions(text: str, has_meal_plan: bool = False) -> list:
        lower_text = text.lower()
        actions = []

        if has_meal_plan or "meal plan" in lower_text:
            actions.append({"text": "See full meal plan", "action": "view_meal_plan"})
        if any(word in lower_text for word in ["food", "eat", "try", "meal"]):
            actions.append({"text": "Explore foods", "action": "explore_foods"})
        if "symptom" in lower_text or "help" in lower_text:
            actions.append({"text": "Track symptom", "action": "track_symptom"})

        return actions

    @staticmethod
    def format_meal_plan_response(plan_data: List[Dict]) -> Dict:
        if not plan_data:
            return {
                "success": False,
                "message": "Meal plan not found.",
                "plans": [],
            }

        formatted_plans = [ResponseFormatter._format_single_plan(plan) for plan in plan_data]
        primary = formatted_plans[0]
        return {
            "success": True,
            "message": "Meal plan found.",
            "plans": formatted_plans,
            **primary,
        }

    @staticmethod
    def _format_single_plan(plan: Dict) -> Dict:
        days = []
        for day_data in sorted(plan.get("daily_plan") or [], key=lambda value: value.get("day") or 0):
            days.append(
                {
                    "day": day_data.get("day"),
                    "meals": day_data.get("meals", []),
                    "totals": {
                        "calories": day_data.get("total_calories"),
                        "protein": day_data.get("protein"),
                        "carbs": day_data.get("carbs"),
                        "fat": day_data.get("fat"),
                    },
                }
            )

        return {
            "name": plan.get("plan_name"),
            "description": plan.get("description"),
            "duration": plan.get("duration") or len(days) or 7,
            "difficulty": plan.get("difficulty"),
            "focus": plan.get("focus"),
            "addressed_symptoms": plan.get("addressed_symptoms", []),
            "match_count": plan.get("symptom_match_count", 0),
            "days": days,
        }


response_formatter = ResponseFormatter()
