from typing import List, Dict, Any, Optional
from core.neo4j_client import neo4j_client
import logging

logger = logging.getLogger(__name__)

class GraphService:
    """Service to query the PCOS knowledge graph"""
    
    async def get_foods_by_symptom(self, symptom: str) -> List[Dict]:
        """Find foods that help with a specific symptom"""
        query = """
        MATCH (f:Food)-[r:HELPS]->(s:Symptom)
        WHERE toLower(s.name) CONTAINS toLower($symptom)
        OPTIONAL MATCH (f)-[:CONTAINS]->(n:Nutrient)
        RETURN f.name AS food, 
               f.description AS description,
               f.gi_score AS gi_score,
               collect(DISTINCT {
                   nutrient: n.name,
                   amount: r.amount
               }) AS nutrients,
               r.mechanism AS how_it_helps,
               r.strength AS effectiveness
        ORDER BY r.strength DESC
        LIMIT 10
        """
        return await neo4j_client.run_query(query, {"symptom": symptom})
    
    async def get_foods_to_avoid(self, symptom: str) -> List[Dict]:
        """Find foods that worsen a specific symptom"""
        query = """
        MATCH (f:Food)-[r:WORSENS]->(s:Symptom)
        WHERE toLower(s.name) CONTAINS toLower($symptom)
        RETURN f.name AS food, 
               f.description AS description,
               f.gi_score AS gi_score,
               r.mechanism AS why_bad,
               r.strength AS severity
        ORDER BY r.strength DESC
        LIMIT 10
        """
        return await neo4j_client.run_query(query, {"symptom": symptom})
    
    async def get_meal_plan_for_symptoms(self, symptoms: List[str]) -> List[Dict]:
        """Find meal plans that address multiple symptoms (Fixed nested aggregations)"""
        query = """
        MATCH (mp:MealPlan)-[:ADDRESSES_SYMPTOM]->(s:Symptom)
        WHERE toLower(s.name) IN $symptoms
        WITH mp, count(s) AS symptom_match_count
        ORDER BY symptom_match_count DESC
        LIMIT 3
        
        OPTIONAL MATCH (mp)-[:HAS_DAY]->(dm:DailyMeal)
        OPTIONAL MATCH (dm)-[:INCLUDES]->(me:MealEntry)
        OPTIONAL MATCH (me)-[:CONTAINS_FOOD]->(f:Food)
        
        // Step 1: Aggregate foods into a list per meal
        WITH mp, dm, me, collect(DISTINCT f.name) AS food_list
        
        // Step 2: Aggregate meals into a list per day
        WITH mp, dm, collect({
            name: me.meal_name,
            type: me.meal_type,
            calories: me.calories,
            protein: me.protein_g,
            foods: food_list
        }) AS meal_list
        
        // Step 3: Aggregate days into a list per plan and return
        RETURN mp.name AS plan_name,
               mp.description AS description,
               mp.duration_days AS duration,
               mp.difficulty AS difficulty,
               mp.focus AS focus,
               collect({
                   day: dm.day_number,
                   meals: meal_list
               }) AS daily_plan
        """
        symptom_list = [s.lower() for s in symptoms]
        return await neo4j_client.run_query(query, {"symptoms": symptom_list})
    
    async def get_food_details(self, food_name: str) -> Dict:
        """Get complete profile for a specific food using Pattern Comprehension (Cartesian safe)"""
        query = """
        MATCH (f:Food {name: $food_name})
        RETURN f.name AS food,
               f.description AS description,
               f.gi_score AS gi_score,
               f.category AS category,
               
               // Pattern Comprehensions: Creates lists dynamically without cross-product explosion
               [(f)-[:CONTAINS]->(n:Nutrient) | {
                   nutrient: n.name, 
                   function: n.function
               }] AS nutrients,
               
               [(f)-[r:HELPS]->(s:Symptom) | {
                   symptom: s.name, 
                   how: r.mechanism
               }] AS helps_with,
               
               [(f)-[r:WORSENS]->(s:Symptom) | {
                   symptom: s.name, 
                   why: r.mechanism
               }] AS worsens,
               
               [(f)-[r:BALANCES|STABILIZES|SPIKES]->(h:Hormone) | {
                   hormone: h.name, 
                   effect: type(r)
               }] AS hormone_effects
        """
        result = await neo4j_client.run_query(query, {"food_name": food_name})
        return result[0] if result else {}
    
    async def get_daily_meal(self, plan_name: str, day: int) -> List[Dict]:
        """Get complete meal for a specific day (Fixed nested aggregations)"""
        query = """
        MATCH (mp:MealPlan {name: $plan_name})-[:HAS_DAY]->(dm:DailyMeal {day_number: $day})
        MATCH (dm)-[:INCLUDES]->(me:MealEntry)
        OPTIONAL MATCH (me)-[:CONTAINS_FOOD]->(f:Food)
        OPTIONAL MATCH (me)-[:BASED_ON]->(r:Recipe)
        
        // Step 1: Aggregate foods per meal, keeping meal ordering intact
        WITH dm, me, r.name AS recipe_name, collect(DISTINCT f.name) AS food_list
        ORDER BY me.meal_order
        
        // Step 2: Assemble the final dictionary
        RETURN dm.day_number AS day,
               dm.total_calories AS total_calories,
               dm.total_protein_g AS protein,
               dm.total_carbs_g AS carbs,
               dm.total_fat_g AS fat,
               collect({
                   meal_order: me.meal_order,
                   meal_name: me.meal_name,
                   meal_type: me.meal_type,
                   calories: me.calories,
                   protein: me.protein_g,
                   foods: food_list,
                   recipe: recipe_name
               }) AS meals
        """
        return await neo4j_client.run_query(query, {"plan_name": plan_name, "day": day})
    
    async def hybrid_search(self, query_text: str) -> List[Dict]:
        """Combined search across foods, symptoms, and meal plans"""
        food_query = """
        MATCH (f:Food)
        WHERE toLower(f.name) CONTAINS toLower($query)
           OR toLower(f.description) CONTAINS toLower($query)
        RETURN 'food' AS type, f.name AS name, f.description AS description
        LIMIT 5
        """
        
        symptom_query = """
        MATCH (s:Symptom)
        WHERE toLower(s.name) CONTAINS toLower($query)
        RETURN 'symptom' AS type, s.name AS name, s.description AS description
        LIMIT 5
        """
        
        plan_query = """
        MATCH (mp:MealPlan)
        WHERE toLower(mp.name) CONTAINS toLower($query)
           OR toLower(mp.description) CONTAINS toLower($query)
        RETURN 'meal_plan' AS type, mp.name AS name, mp.description AS description
        LIMIT 3
        """
        
        foods = await neo4j_client.run_query(food_query, {"query": query_text})
        symptoms = await neo4j_client.run_query(symptom_query, {"query": query_text})
        plans = await neo4j_client.run_query(plan_query, {"query": query_text})
        
        return foods + symptoms + plans

graph_service = GraphService()