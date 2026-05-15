import logging
from typing import Dict, List

from core.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)


class GraphService:
    async def get_foods_by_symptom(self, symptom: str) -> List[Dict]:
        query = """
        MATCH (f)-[r:HELPS]->(s:Symptom)
        WHERE ('Food' IN labels(f) OR 'foods' IN labels(f))
          AND toLower(s.name) CONTAINS toLower($symptom)
        OPTIONAL MATCH (f)-[:CONTAINS]->(n:Nutrient)
        RETURN f.name AS food,
               f.description AS description,
               f.gi_score AS gi_score,
               collect(DISTINCT {nutrient: n.name, amount: r.amount}) AS nutrients,
               r.mechanism AS how_it_helps,
               r.strength AS effectiveness
        ORDER BY effectiveness DESC
        LIMIT 10
        """
        rows = await neo4j_client.run_query(query, {"symptom": symptom})
        if rows:
            return rows

        fallback_query = """
        MATCH (f)
        WHERE ('Food' IN labels(f) OR 'foods' IN labels(f))
          AND coalesce(f.inflammation_score, 1) <= 1
          AND coalesce(f.gi_score, 55) <= 55
        RETURN f.name AS food,
               f.description AS description,
               f.gi_score AS gi_score,
               f.category AS category,
               [] AS nutrients,
               'Low GI or anti-inflammatory food that can support PCOS symptom management.' AS how_it_helps,
               1 AS effectiveness
        ORDER BY coalesce(f.inflammation_score, 1) ASC, coalesce(f.gi_score, 55) ASC, f.name ASC
        LIMIT 10
        """
        return await neo4j_client.run_query(fallback_query)

    async def get_foods_to_avoid(self, symptom: str) -> List[Dict]:
        query = """
        MATCH (f)-[r:WORSENS]->(s:Symptom)
        WHERE ('Food' IN labels(f) OR 'foods' IN labels(f))
          AND toLower(s.name) CONTAINS toLower($symptom)
        RETURN f.name AS food,
               f.description AS description,
               f.gi_score AS gi_score,
               r.mechanism AS why_bad,
               r.strength AS severity
        ORDER BY severity DESC
        LIMIT 10
        """
        rows = await neo4j_client.run_query(query, {"symptom": symptom})
        if rows:
            return rows

        fallback_query = """
        MATCH (f)
        WHERE ('Food' IN labels(f) OR 'foods' IN labels(f))
          AND (coalesce(f.inflammation_score, 0) >= 2 OR coalesce(f.gi_score, 0) >= 70)
        RETURN f.name AS food,
               f.description AS description,
               f.gi_score AS gi_score,
               f.category AS category,
               'Higher GI or more inflammatory option; limit portions for steadier blood sugar.' AS why_bad,
               coalesce(f.inflammation_score, 2) AS severity
        ORDER BY severity DESC, coalesce(f.gi_score, 0) DESC
        LIMIT 10
        """
        return await neo4j_client.run_query(fallback_query)

    async def get_meal_plan_for_symptoms(self, symptoms: List[str]) -> List[Dict]:
        query = """
        MATCH (mp:MealPlan)
        OPTIONAL MATCH (mp)-[:ADDRESSES_SYMPTOM]->(s:Symptom)
        WITH mp,
             collect(DISTINCT s.name) AS addressed_symptoms,
             count(CASE WHEN toLower(s.name) IN $symptoms THEN 1 END) AS symptom_match_count
        WHERE symptom_match_count > 0 OR size($symptoms) = 0
        WITH mp, addressed_symptoms, symptom_match_count
        ORDER BY symptom_match_count DESC, mp.name ASC
        LIMIT $limit

        OPTIONAL MATCH (mp)-[:HAS_DAY]->(dm:DailyMeal)
        WITH mp, addressed_symptoms, dm, symptom_match_count
        ORDER BY dm.day_number ASC
        OPTIONAL MATCH (dm)-[:INCLUDES]->(me:MealEntry)
        WITH mp, addressed_symptoms, dm, me, symptom_match_count
        ORDER BY dm.day_number ASC, me.meal_order ASC
        OPTIONAL MATCH (me)-[:CONTAINS_FOOD]->(f:Food)
        WITH mp, addressed_symptoms, dm, me, symptom_match_count, collect(DISTINCT f.name) AS food_list
        WITH mp,
             addressed_symptoms,
             dm,
             symptom_match_count,
             collect(CASE WHEN me IS NULL THEN NULL ELSE {
                 name: me.meal_name,
                 type: me.meal_type,
                 calories: me.calories,
                 protein: me.protein_g,
                 foods: food_list
             } END) AS meal_list
        WITH mp,
             addressed_symptoms,
             symptom_match_count,
             collect(CASE WHEN dm IS NULL THEN NULL ELSE {
                 day: dm.day_number,
                 meals: [meal IN meal_list WHERE meal IS NOT NULL],
                 total_calories: dm.total_calories,
                 protein: dm.total_protein_g,
                 carbs: dm.total_carbs_g,
                 fat: dm.total_fat_g
             } END) AS daily_plan
        RETURN mp.name AS plan_name,
               mp.description AS description,
               coalesce(mp.duration_days, 7) AS duration,
               mp.difficulty AS difficulty,
               mp.focus AS focus,
               addressed_symptoms,
               symptom_match_count,
               [day IN daily_plan WHERE day IS NOT NULL] AS daily_plan
        """
        symptom_list = sorted({symptom.strip().lower() for symptom in symptoms if symptom and symptom.strip()})
        rows = await neo4j_client.run_query(query, {"symptoms": symptom_list, "limit": 3})
        for row in rows:
            self._complete_seven_day_plan(row)
        return rows

    async def get_default_meal_plans(self) -> List[Dict]:
        return await self.get_meal_plan_for_symptoms([])

    async def get_food_details(self, food_name: str) -> Dict:
        query = """
        MATCH (f)
        WHERE ('Food' IN labels(f) OR 'foods' IN labels(f))
          AND toLower(f.name) = toLower($food_name)
        RETURN f.name AS food,
               f.description AS description,
               f.gi_score AS gi_score,
               f.category AS category,
               [(f)-[:CONTAINS]->(n:Nutrient) | {nutrient: n.name, function: n.function}] AS nutrients,
               [(f)-[r:HELPS]->(s:Symptom) | {symptom: s.name, how: r.mechanism}] AS helps_with,
               [(f)-[r:WORSENS]->(s:Symptom) | {symptom: s.name, why: r.mechanism}] AS worsens,
               [(f)-[r:BALANCES|STABILIZES|SPIKES]->(h:Hormone) | {hormone: h.name, effect: type(r)}] AS hormone_effects
        LIMIT 1
        """
        result = await neo4j_client.run_query(query, {"food_name": food_name})
        return result[0] if result else {}

    async def get_daily_meal(self, plan_name: str, day: int) -> List[Dict]:
        query = """
        MATCH (mp:MealPlan)
        WHERE toLower(mp.name) = toLower($plan_name)
        MATCH (mp)-[:HAS_DAY]->(dm:DailyMeal {day_number: $day})
        OPTIONAL MATCH (dm)-[:INCLUDES]->(me:MealEntry)
        WITH dm, me
        ORDER BY me.meal_order ASC
        OPTIONAL MATCH (me)-[:CONTAINS_FOOD]->(f:Food)
        OPTIONAL MATCH (me)-[:BASED_ON]->(r:Recipe)
        WITH dm, me, r.name AS recipe_name, collect(DISTINCT f.name) AS food_list
        ORDER BY me.meal_order ASC
        RETURN dm.day_number AS day,
               dm.total_calories AS total_calories,
               dm.total_protein_g AS protein,
               dm.total_carbs_g AS carbs,
               dm.total_fat_g AS fat,
               collect(CASE WHEN me IS NULL THEN NULL ELSE {
                   meal_order: me.meal_order,
                   meal_name: me.meal_name,
                   meal_type: me.meal_type,
                   calories: me.calories,
                   protein: me.protein_g,
                   foods: food_list,
                   recipe: recipe_name
               } END) AS meals
        """
        rows = await neo4j_client.run_query(query, {"plan_name": plan_name, "day": day})
        for row in rows:
            row["meals"] = [meal for meal in (row.get("meals") or []) if meal]
        if rows and not rows[0].get("meals"):
            plans = await self.get_meal_plan_for_symptoms([])
            selected = next((plan for plan in plans if str(plan.get("plan_name", "")).lower() == plan_name.lower()), None)
            generated_day = next((item for item in (selected or {}).get("daily_plan", []) if item.get("day") == day), None)
            if generated_day and generated_day.get("meals"):
                rows[0]["meals"] = generated_day["meals"]
                rows[0]["generated_from_day"] = generated_day.get("generated_from_day")
        return rows

    async def get_full_week(self, plan_name: str) -> Dict:
        plans = await self.get_meal_plan_for_symptoms([])
        selected = next((plan for plan in plans if str(plan.get("plan_name", "")).lower() == plan_name.lower()), None)
        if selected:
            return {"plan": selected.get("plan_name"), "days": selected.get("daily_plan", [])}

        days = []
        for day in range(1, 8):
            meals = await self.get_daily_meal(plan_name, day)
            if meals:
                days.append(meals[0])
        return {"plan": plan_name, "days": days}

    @staticmethod
    def _complete_seven_day_plan(plan: Dict) -> None:
        daily_plan = sorted(plan.get("daily_plan") or [], key=lambda day: day.get("day") or 0)
        if not daily_plan:
            plan["daily_plan"] = []
            return

        by_day = {day.get("day"): day for day in daily_plan if day.get("day")}
        templates = [day for day in daily_plan if day.get("meals")]
        if not templates:
            plan["daily_plan"] = daily_plan
            return

        completed = []
        for day_number in range(1, 8):
            current = by_day.get(day_number)
            if current and current.get("meals"):
                completed.append(current)
                continue

            template = templates[(day_number - 1) % len(templates)]
            completed.append(
                {
                    **(current or {}),
                    "day": day_number,
                    "meals": template.get("meals", []),
                    "total_calories": (current or template).get("total_calories"),
                    "protein": (current or template).get("protein"),
                    "carbs": (current or template).get("carbs"),
                    "fat": (current or template).get("fat"),
                    "generated_from_day": template.get("day"),
                }
            )

        plan["daily_plan"] = completed

    async def hybrid_search(self, query_text: str) -> List[Dict]:
        food_query = """
          MATCH (f)
          WHERE ('Food' IN labels(f) OR 'foods' IN labels(f))
            AND (toLower(f.name) CONTAINS toLower($query)
             OR toLower(coalesce(f.description, '')) CONTAINS toLower($query))
        RETURN 'food' AS type, f.name AS name, f.description AS description
        LIMIT 5
        """
        symptom_query = """
        MATCH (s:Symptom)
        WHERE toLower(s.name) CONTAINS toLower($query)
           OR toLower(coalesce(s.description, '')) CONTAINS toLower($query)
        RETURN 'symptom' AS type, s.name AS name, s.description AS description
        LIMIT 5
        """
        plan_query = """
        MATCH (mp:MealPlan)
        WHERE toLower(mp.name) CONTAINS toLower($query)
           OR toLower(coalesce(mp.description, '')) CONTAINS toLower($query)
        RETURN 'meal_plan' AS type, mp.name AS name, mp.description AS description
        LIMIT 3
        """
        foods = await neo4j_client.run_query(food_query, {"query": query_text})
        symptoms = await neo4j_client.run_query(symptom_query, {"query": query_text})
        plans = await neo4j_client.run_query(plan_query, {"query": query_text})
        return foods + symptoms + plans


graph_service = GraphService()
