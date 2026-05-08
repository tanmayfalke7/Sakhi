# import asyncio
# import json
# import logging
# import re

# from google import genai
# from google.genai import types
# from pydantic import BaseModel, Field

# from core.config import settings

# logger = logging.getLogger(__name__)


# class GeminiChatPayload(BaseModel):
#     answer: str = Field(description="Final user-facing answer")
#     visual_keyword: str = Field(description='Short stock-photo keyword or "none"')


# class LLMService:
#     def __init__(self):
#         """Initialize Google Gemini client."""
#         self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
#         self.model = settings.GEMINI_MODEL

#         self.system_prompt = """You are Glow, a warm, empowering PCOS nutrition coach for women 18-27.

# PERSONALITY:
# - Like a supportive big sister who's been through it
# - Body-positive, never judgmental, always encouraging
# - Uses casual, friendly language naturally
# - Celebrates small wins and gives confidence

# VOICE:
# - Warm and relatable
# - Encouraging and practical
# - Always specific enough to be useful today

# KNOWLEDGE:
# Base all answers on the graph data provided in the context. Never make up facts.
# If data is missing, say so clearly and offer safe, practical general guidance.

# RESPONSE STRUCTURE:
# 1. Warm acknowledgment
# 2. What the science says from the graph context
# 3. Practical food or meal guidance
# 4. Short, encouraging next step
# Keep responses concise and actionable."""

#     async def generate_response_with_keyword(
#         self,
#         user_message: str,
#         graph_context: list,
#         conversation_history: list = None,
#     ) -> tuple[str, str]:
#         """Generate a response plus a visual keyword for image lookup."""

#         context_text = self._format_context(graph_context)
#         json_prompt = f"""{self.system_prompt}

# GRAPH CONTEXT:
# {context_text}

# USER MESSAGE: {user_message}

# Return only structured data with:
# - answer: the final user-facing reply
# - visual_keyword: a simple 1-3 word stock-photo search phrase, or "none"
# """

#         max_retries = 3

#         for attempt in range(max_retries):
#             try:
#                 response = await self.client.aio.models.generate_content(
#                     model=self.model,
#                     contents=json_prompt,
#                     config=types.GenerateContentConfig(
#                         temperature=settings.TEMPERATURE,
#                         max_output_tokens=settings.MAX_TOKENS,
#                         top_p=settings.TOP_P,
#                         response_mime_type="application/json",
#                         response_schema=GeminiChatPayload,
#                     ),
#                 )

#                 parsed = self._parse_structured_response(response)
#                 return parsed.answer, parsed.visual_keyword

#             except Exception as error:
#                 error_msg = str(error)
#                 logger.error(f"Gemini API error (Attempt {attempt + 1}/{max_retries}): {error_msg}")

#                 if "503" in error_msg and attempt < max_retries - 1:
#                     wait_time = 2 ** attempt
#                     logger.info(f"Retrying in {wait_time} seconds...")
#                     await asyncio.sleep(wait_time)
#                     continue

#                 if attempt == max_retries - 1:
#                     fallback_msg = (
#                         "Hey love! I have a helpful suggestion for you, but the reply formatting broke. "
#                         "Try asking me something specific like 'Give me a PCOS-friendly breakfast idea'."
#                     )
#                 return fallback_msg, "none"

#         return "Hey love! Please try again in a moment.", "none"

#     async def extract_visual_keyword(self, user_message: str, graph_context: list) -> str:
#         """Fast keyword-only request used by streaming mode."""
#         context_text = self._format_context(graph_context)
#         prompt = f"""Based on this user query: "{user_message}" and this context: {context_text}
# Provide only a single 1-2 word search term for a stock photo such as "healthy diet", "yoga", or "sleep".
# Do not output any other text."""

#         try:
#             response = await self.client.aio.models.generate_content(
#                 model=self.model,
#                 contents=prompt,
#                 config=types.GenerateContentConfig(
#                     temperature=0.1,
#                     max_output_tokens=10,
#                 ),
#             )
#             return response.text.strip().replace('"', "")
#         except Exception:
#             return "none"

#     async def stream_response(
#         self,
#         user_message: str,
#         graph_context: list,
#         conversation_history: list = None,
#     ):
#         """Stream a text response for real-time chat."""

#         context_text = self._format_context(graph_context)
#         full_prompt = f"""{self.system_prompt}

# Context from knowledge graph:
# {context_text}

# User: {user_message}

# Respond warmly with practical advice:"""

#         try:
#             response = await self.client.aio.models.generate_content_stream(
#                 model=self.model,
#                 contents=full_prompt,
#                 config=types.GenerateContentConfig(
#                     temperature=settings.TEMPERATURE,
#                     max_output_tokens=settings.MAX_TOKENS,
#                     top_p=settings.TOP_P,
#                 ),
#             )

#             async for chunk in response:
#                 if chunk.text:
#                     yield chunk.text

#         except Exception as error:
#             logger.error(f"Gemini stream error: {error}")
#             yield "Oops! Connection hiccup, but I'm still here for you."

#     def _parse_structured_response(self, response) -> GeminiChatPayload:
#         """Prefer SDK-native structured parsing, then fall back to cleaned JSON text."""
#         if getattr(response, "parsed", None):
#             parsed = response.parsed
#             if isinstance(parsed, GeminiChatPayload):
#                 return parsed
#             if isinstance(parsed, dict):
#                 return self._payload_from_mapping(parsed)

#         raw_text = (getattr(response, "text", "") or "").strip()
#         cleaned = self._clean_json_text(raw_text)

#         if cleaned:
#             try:
#                 return self._payload_from_mapping(json.loads(cleaned))
#             except Exception as parse_error:
#                 logger.warning(f"Primary JSON parse fallback failed: {parse_error}")

#             extracted = self._extract_first_json_object(cleaned)
#             if extracted:
#                 try:
#                     return self._payload_from_mapping(json.loads(extracted))
#                 except Exception as parse_error:
#                     logger.warning(f"Secondary JSON parse fallback failed: {parse_error}")

#         raise ValueError(f"Structured Gemini response could not be parsed: {raw_text[:300]}")

#     @staticmethod
#     def _payload_from_mapping(data: dict) -> GeminiChatPayload:
#         return GeminiChatPayload(
#             answer=str(data.get("answer") or "Hey love! My brain had a tiny hiccup!"),
#             visual_keyword=str(data.get("visual_keyword") or "none"),
#         )

#     @staticmethod
#     def _clean_json_text(raw_text: str) -> str:
#         if not raw_text:
#             return ""

#         cleaned = raw_text.strip()
#         if cleaned.startswith("```"):
#             cleaned = re.sub(r"^```json\s*|^```\s*", "", cleaned)
#             cleaned = re.sub(r"\s*```$", "", cleaned).strip()
#         return cleaned

#     @staticmethod
#     def _extract_first_json_object(text: str) -> str | None:
#         start = text.find("{")
#         end = text.rfind("}")
#         if start == -1 or end == -1 or end <= start:
#             return None
#         return text[start : end + 1]

#     def _format_context(self, graph_data: list) -> str:
#         """Make graph data readable for Gemini."""
#         if not graph_data:
#             return "No specific graph data found. Use safe general PCOS nutrition guidance."

#         lines = []
#         for item in graph_data[:5]:
#             if "food" in item:
#                 line = f"- Food: {item['food']}"
#                 if "description" in item:
#                     line += f" - {item['description']}"
#                 if "how_it_helps" in item:
#                     line += f"\n  Helps: {item['how_it_helps']}"
#                 if "nutrients" in item:
#                     nutrients = [n.get("nutrient") for n in item["nutrients"] if n.get("nutrient")]
#                     if nutrients:
#                         line += f"\n  Contains: {', '.join(nutrients[:3])}"
#                 lines.append(line)

#             elif "plan_name" in item:
#                 lines.append(f"- Meal Plan: {item['plan_name']}")
#                 if "description" in item:
#                     lines.append(f"  {item['description']}")
#                 if "duration" in item:
#                     lines.append(f"  {item['duration']} days")

#             elif "type" in item:
#                 lines.append(f"- {item['type']}: {item['name']}")

#             lines.append("")

#         return "\n".join(lines)


# llm_service = LLMService()
import asyncio
import json
import logging
import re
import time

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from core.config import settings

logger = logging.getLogger(__name__)


class GeminiChatPayload(BaseModel):
    answer: str = Field(description="Final user-facing answer")
    visual_keyword: str = Field(description='Short stock-photo keyword or "none"')


class LLMService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL

        self.system_prompt = """
You are Glow, a warm and empowering PCOS nutrition coach for women aged 18-27.

RULES:
- Speak like a caring elder sister
- Friendly, practical, motivating
- Never shame body image or weight
- Give realistic daily suggestions
- Keep answers concise
- Use graph context first
- If missing data, say honestly and give safe advice

OUTPUT:
Return only JSON:
{
 "answer":"helpful reply",
 "visual_keyword":"1-3 word image keyword or none"
}
"""

    async def generate_response_with_keyword(
        self,
        user_message: str,
        graph_context: list,
        conversation_history: list = None,
    ) -> tuple[str, str]:

        fallback_msg = (
            "Hey love 💛 I'm having a tiny tech hiccup right now. "
            "For today, try a balanced meal with protein, fiber, and healthy fats."
        )

        if self._is_harmful_query(user_message):
            return (
                "I'm here for healthy PCOS support only 💛 "
                "Please ask me about food, fitness, hormones, sleep, or wellness.",
                "none",
            )

        context_text = self._format_context(graph_context)

        prompt = f"""
{self.system_prompt}

GRAPH CONTEXT:
{context_text}

USER MESSAGE:
{user_message}
"""

        max_retries = 3

        for attempt in range(max_retries):
            try:
                start = time.time()

                response = await self.client.aio.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.6,
                        max_output_tokens=450,
                        top_p=0.9,
                        response_mime_type="application/json",
                        response_schema=GeminiChatPayload,
                    ),
                )

                parsed = self._parse_structured_response(response)

                logger.info(
                    f"Gemini success in {time.time() - start:.2f}s | Attempt {attempt+1}"
                )

                return parsed.answer, parsed.visual_keyword

            except Exception as error:
                logger.error(
                    f"Gemini error Attempt {attempt+1}/{max_retries}: {str(error)}"
                )

                if "503" in str(error) and attempt < max_retries - 1:
                    wait = 2 ** attempt
                    logger.info(f"Retrying in {wait}s...")
                    await asyncio.sleep(wait)
                    continue

                if attempt == max_retries - 1:
                    return fallback_msg, "none"

        return fallback_msg, "none"

    async def stream_response(
        self,
        user_message: str,
        graph_context: list,
        conversation_history: list = None,
    ):
        context_text = self._format_context(graph_context)

        prompt = f"""
You are Glow, a PCOS wellness guide.

Context:
{context_text}

User:
{user_message}

Give warm practical advice.
"""

        try:
            response = await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.6,
                    max_output_tokens=400,
                ),
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as error:
            logger.error(f"Stream error: {error}")
            yield "Oops 💛 Small connection hiccup. Please try again."

    def _parse_structured_response(self, response) -> GeminiChatPayload:

        if getattr(response, "parsed", None):
            parsed = response.parsed

            if isinstance(parsed, GeminiChatPayload):
                return parsed

            if isinstance(parsed, dict):
                return self._payload_from_mapping(parsed)

        raw_text = (getattr(response, "text", "") or "").strip()

        cleaned = self._clean_json_text(raw_text)

        try:
            return self._payload_from_mapping(json.loads(cleaned))
        except Exception:
            extracted = self._extract_first_json_object(cleaned)

            if extracted:
                try:
                    return self._payload_from_mapping(json.loads(extracted))
                except Exception:
                    pass

        return GeminiChatPayload(
            answer=raw_text[:400] if raw_text else "Hey love 💛 Please try again.",
            visual_keyword="none",
        )

    @staticmethod
    def _payload_from_mapping(data: dict) -> GeminiChatPayload:
        return GeminiChatPayload(
            answer=str(data.get("answer") or "Hey love 💛"),
            visual_keyword=str(data.get("visual_keyword") or "none"),
        )

    @staticmethod
    def _clean_json_text(raw_text: str) -> str:
        if not raw_text:
            return ""

        cleaned = raw_text.strip()
        cleaned = cleaned.replace("```json", "").replace("```", "")
        return cleaned.strip()

    @staticmethod
    def _extract_first_json_object(text: str):
        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end == -1 or end <= start:
            return None

        return text[start:end + 1]

    @staticmethod
    def _is_harmful_query(text: str) -> bool:
        blocked = [
            "suicide",
            "kill myself",
            "starve myself",
            "extreme diet pills",
            "self harm",
        ]

        text = text.lower()

        return any(word in text for word in blocked)

    def _format_context(self, graph_data: list) -> str:

        if not graph_data:
            return "No graph data available. Use safe PCOS guidance."

        lines = []

        for item in graph_data[:5]:

            if "food" in item:
                line = f"- Food: {item['food']}"

                if "description" in item:
                    line += f" | {item['description']}"

                if "how_it_helps" in item:
                    line += f" | Helps: {item['how_it_helps']}"

                lines.append(line)

            elif "plan_name" in item:
                lines.append(f"- Meal Plan: {item['plan_name']}")

            elif "type" in item:
                lines.append(f"- {item['type']}: {item['name']}")

        return "\n".join(lines)


llm_service = LLMService()