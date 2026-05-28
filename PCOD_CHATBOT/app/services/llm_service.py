import asyncio
import json
import logging
import re
from json import JSONDecodeError
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

from core.config import settings

logger = logging.getLogger(__name__)


class GeminiChatPayload(BaseModel):
    answer: str = Field(description="Final user-facing answer")
    visual_keyword: str = Field(description='Short stock-photo keyword or "none"')


class LLMService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
        self.model = settings.GEMINI_MODEL
        self.system_prompt = """
You are Glow, a warm and empowering PCOS health and nutrition coach.

Use the supplied graph context first. Be practical, concise, body-positive, and medically safe.
For meal plans,summarize the 7-day plan from the graph data without inventing missing meals.

Return only JSON with exactly this shape:
{
  "answer": "final user-facing answer",
  "visual_keyword": "1-3 word image keyword or none"
}
"""

    async def generate_response_with_keyword(
        self,
        user_message: str,
        graph_context: list,
        conversation_history: list | None = None,
    ) -> tuple[str, str]:
        if self._is_harmful_query(user_message):
            return (
                "I can support PCOS nutrition, wellness, and symptom questions, but I cannot help with self-harm or unsafe dieting. If you feel at risk, please contact local emergency support or a trusted person right now.",
                "none",
            )

        if not self.client:
            return self._fallback_answer(graph_context), "none"

        prompt = f"""{self.system_prompt}

GRAPH CONTEXT:
{self._format_context(graph_context)}

USER MESSAGE:
{user_message}
"""

        for attempt in range(3):
            try:
                response = await self.client.aio.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=settings.TEMPERATURE,
                        max_output_tokens=settings.MAX_TOKENS,
                        top_p=settings.TOP_P,
                        response_mime_type="application/json",
                        response_schema=GeminiChatPayload,
                    ),
                )
                parsed = self._parse_structured_response(response)
                return parsed.answer.strip(), self._safe_keyword(parsed.visual_keyword)
            except Exception as error:
                logger.warning("Gemini response attempt %s failed: %s", attempt + 1, error)
                if attempt < 2 and self._is_retryable(error):
                    await asyncio.sleep(2**attempt)
                    continue

        return self._fallback_answer(graph_context), "none"

    async def extract_visual_keyword(self, user_message: str, graph_context: list) -> str:
        if not self.client:
            return "none"

        prompt = f"""Return only one 1-3 word lifestyle image keyword for this PCOS query.
Query: {user_message}
Context: {self._format_context(graph_context)[:1200]}
"""
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=16),
            )
            return self._safe_keyword(getattr(response, "text", "none"))
        except Exception as error:
            logger.warning("Visual keyword extraction failed: %s", error)
            return "none"

    async def stream_response(
        self,
        user_message: str,
        graph_context: list,
        conversation_history: list | None = None,
    ):
        if not self.client:
            yield self._fallback_answer(graph_context)
            return

        prompt = f"""You are Glow, a PCOS wellness guide.

Context:
{self._format_context(graph_context)}

User:
{user_message}

Give warm practical advice."""

        try:
            response = await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=settings.TEMPERATURE,
                    max_output_tokens=settings.MAX_TOKENS,
                    top_p=settings.TOP_P,
                ),
            )
            async for chunk in response:
                text = getattr(chunk, "text", None)
                if text:
                    yield text
        except Exception as error:
            logger.warning("Gemini stream failed: %s", error)
            yield self._fallback_answer(graph_context)

    def _parse_structured_response(self, response: Any) -> GeminiChatPayload:
        parsed = getattr(response, "parsed", None)
        if parsed:
            if isinstance(parsed, GeminiChatPayload):
                return parsed
            if isinstance(parsed, dict):
                return self._payload_from_mapping(parsed)

        raw_text = (getattr(response, "text", "") or "").strip()
        for candidate in self._json_candidates(raw_text):
            try:
                data = json.loads(candidate)
                return self._payload_from_mapping(data)
            except (JSONDecodeError, TypeError, ValidationError):
                continue

        if raw_text:
            logger.warning("Gemini returned non-JSON text; using plain-text fallback.")
            return GeminiChatPayload(answer=self._strip_code_fences(raw_text), visual_keyword="none")

        raise ValueError("Gemini returned an empty response.")

    def _json_candidates(self, text: str) -> list[str]:
        if not text:
            return []

        stripped = self._strip_code_fences(text)
        candidates = [stripped]

        decoder = json.JSONDecoder()
        for index, char in enumerate(stripped):
            if char not in "{[":
                continue
            try:
                _, end = decoder.raw_decode(stripped[index:])
                candidates.append(stripped[index : index + end])
                break
            except JSONDecodeError:
                continue

        object_match = re.search(r"\{.*\}", stripped, flags=re.DOTALL)
        if object_match:
            candidates.append(object_match.group(0))

        return list(dict.fromkeys(candidate.strip() for candidate in candidates if candidate.strip()))

    @staticmethod
    def _payload_from_mapping(data: dict | list) -> GeminiChatPayload:
        if isinstance(data, list):
            data = {"answer": "\n".join(str(item) for item in data), "visual_keyword": "healthy meal"}
        if not isinstance(data, dict):
            data = {"answer": str(data), "visual_keyword": "none"}

        answer = data.get("answer") or data.get("response") or data.get("message") or ""
        visual_keyword = data.get("visual_keyword") or data.get("image_keyword") or "none"
        return GeminiChatPayload(answer=str(answer), visual_keyword=str(visual_keyword))

    @staticmethod
    def _strip_code_fences(text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)
        return text.strip()

    @staticmethod
    def _safe_keyword(keyword: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9\s-]", "", str(keyword or "none")).strip().lower()
        return cleaned[:60] or "none"

    @staticmethod
    def _is_retryable(error: Exception) -> bool:
        text = str(error).lower()
        return any(code in text for code in ["429", "500", "502", "503", "504", "timeout", "unavailable"])

    @staticmethod
    def _is_harmful_query(text: str) -> bool:
        text = text.lower()
        blocked = ["suicide", "kill myself", "starve myself", "self harm", "extreme diet pills"]
        return any(word in text for word in blocked)

    def _fallback_answer(self, graph_context: list) -> str:
        meal_plans = [item for item in graph_context if item.get("plan_name")]
        if meal_plans:
            return self._meal_plan_fallback(meal_plans[0])

        foods = [item.get("food") for item in graph_context if item.get("food")]
        if foods:
            names = ", ".join(foods[:5])
            return f"Based on the knowledge graph, these PCOS-friendly options may help: {names}. Pair one with protein, fiber, and healthy fats for steadier energy."

        return "I could not format the AI response clearly, but a balanced PCOS-friendly plate is a good start: protein, high-fiber carbs, colorful vegetables, and healthy fats."

    @staticmethod
    def _meal_plan_fallback(plan: dict) -> str:
        lines = [f"Here is your 7-day PCOS-friendly meal plan: {plan.get('plan_name', 'Meal Plan')}."]
        for day in sorted(plan.get("daily_plan") or [], key=lambda item: item.get("day") or 0):
            meals = []
            for meal in day.get("meals") or []:
                meal_name = meal.get("name") or meal.get("meal_name") or meal.get("type") or "Meal"
                foods = ", ".join(food for food in meal.get("foods", []) if food)
                meals.append(f"{meal_name}: {foods}" if foods else meal_name)
            if meals:
                lines.append(f"Day {day.get('day')}: " + "; ".join(meals))
        return "\n".join(lines)

    def _format_context(self, graph_data: list) -> str:
        if not graph_data:
            return "No graph data available. Use safe general PCOS nutrition guidance."

        lines: list[str] = []
        for item in graph_data[:8]:
            if item.get("food"):
                line = f"- Food: {item['food']}"
                if item.get("description"):
                    line += f" | {item['description']}"
                if item.get("how_it_helps"):
                    line += f" | Helps: {item['how_it_helps']}"
                lines.append(line)
            elif item.get("plan_name"):
                lines.append(f"- Meal Plan: {item.get('plan_name')} ({item.get('duration', 7)} days)")
                for day in sorted(item.get("daily_plan") or [], key=lambda value: value.get("day") or 0)[:7]:
                    meal_names = [
                        meal.get("name") or meal.get("meal_name") or meal.get("type")
                        for meal in (day.get("meals") or [])
                        if meal
                    ]
                    lines.append(f"  Day {day.get('day')}: {', '.join(filter(None, meal_names))}")
            elif item.get("type"):
                lines.append(f"- {item.get('type')}: {item.get('name')} | {item.get('description', '')}")

        return "\n".join(lines)


llm_service = LLMService()
