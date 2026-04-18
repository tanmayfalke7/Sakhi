import re
from typing import Dict, Any, List

class ResponseFormatter:
    """Format responses to be visually engaging"""
    
    @staticmethod
    def format_chat_response(llm_response: str, graph_data: Any = None) -> Dict:
        """Structure the API response with metadata"""
        
        # Detect if response has sections (for UI rendering)
        has_sections = bool(re.search(r'\d\.\s', llm_response))
        
        # Extract any food mentions for quick actions
        food_mentions = ResponseFormatter._extract_food_mentions(llm_response)
        
        # Count emojis for "vibe check"
        emoji_count = len(re.findall(r'[\U0001F300-\U0001F9FF]', llm_response))
        
        return {
            "response": llm_response,
            "metadata": {
                "has_sections": has_sections,
                "emoji_count": emoji_count,
                "vibe": "energetic" if emoji_count > 3 else "warm",
                "food_mentions": food_mentions[:3],  # Top 3
            },
            "suggested_actions": ResponseFormatter._get_suggested_actions(llm_response),
            "graph_data": graph_data  # Include raw data for frontend to use if needed
        }
    
    @staticmethod
    def _extract_food_mentions(text: str) -> list:
        """Extract food names mentioned (simple version)"""
        # This would be more sophisticated with NLP in production
        common_foods = ["oats", "salmon", "spinach", "eggs", "berries", "avocado", 
                       "nuts", "quinoa", "lentils", "kale", "apple", "chia"]
        found = []
        for food in common_foods:
            if food in text.lower():
                found.append(food.title())
        return found
    
    @staticmethod
    def _get_suggested_actions(text: str) -> list:
        """Generate suggested next actions based on response"""
        actions = []
        
        if "meal plan" in text.lower() or "recipe" in text.lower():
            actions.append({
                "text": "✨ See full meal plan",
                "action": "view_meal_plan"
            })
            
        if any(word in text.lower() for word in ["food", "eat", "try"]):
            actions.append({
                "text": "🥑 Explore these foods",
                "action": "explore_foods"
            })
            
        if "symptom" in text.lower() or "help" in text.lower():
            actions.append({
                "text": "🌸 Track this symptom",
                "action": "track_symptom"
            })
            
        return actions
    
    @staticmethod
    def format_meal_plan_response(plan_data: List[Dict]) -> Dict:
        """Format meal plan data for frontend"""
        if not plan_data:
            return {"error": "Meal plan not found"}
            
        plan = plan_data[0]
        
        # Extract days in a structured way
        days = []
        if "daily_plan" in plan:
            for day_data in plan["daily_plan"]:
                days.append({
                    "day": day_data.get("day"),
                    "meals": day_data.get("meals", [])
                })
        
        return {
            "name": plan.get("plan_name"),
            "description": plan.get("description"),
            "duration": plan.get("duration"),
            "difficulty": plan.get("difficulty"),
            "focus": plan.get("focus"),
            "days": days,
            "vibe_intro": f"✨ Your {plan.get('duration')}-day glow-up starts here!"
        }

response_formatter = ResponseFormatter()