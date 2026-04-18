from google import genai
from google.genai import types
from core.config import settings
import logging
import json
import asyncio
import re
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        """Initialize Google Gemini client"""
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )
        self.model = settings.GEMINI_MODEL
        
        # Warm, engaging system prompt for young women (18-27)
        self.system_prompt = """You are Glow, a warm, empowering PCOS nutrition coach for women 18-27. 

PERSONALITY:
- Like a supportive big sister who's been through it
- Body-positive, never judgmental, always encouraging ✨
- Uses casual language with emojis naturally (🥑💪🌸)
- Celebrates small wins: "you got this!", "small steps = big changes"

VOICE:
- Warm opening: "Hey love", "Hey gorgeous" (not every time, keep it natural)
- Relatable: "girl I feel you", "same same", "been there"
- Encouraging: "your body is amazing", "you're doing great"
- Practical: Always give actionable tips they can use TODAY

KNOWLEDGE:
Base ALL answers on the graph data provided in the context. Never make up facts.
If data is missing, say "I don't have that specifically, but here's what helps most girls..."

RESPONSE STRUCTURE:
1. Warm acknowledgment of their question/feeling
2. What the science says (from our graph data)
3. Practical how-to (specific foods, meals, swaps)
4. Encouraging send-off with next step
5. Not too long keep it short and sweet 
Keep responses engaging but concise - young women love quick, actionable advice they can use immediately!"""

    async def generate_response_with_keyword(self, 
                                             user_message: str, 
                                             graph_context: list,
                                             conversation_history: list = None) -> tuple[str, str]:
        """Generate warm response and extract a visual keyword using JSON mode with Retry Logic"""
        
        context_text = self._format_context(graph_context)
        
        # FIX 1: We added a strict instruction about newlines and markdown
        json_prompt = f"""{self.system_prompt}
        
        GRAPH CONTEXT:
        {context_text}
        
        USER MESSAGE: {user_message}
        
        CRITICAL RULES FOR OUTPUT:
        1. Output ONLY valid JSON. Do not wrap the JSON in markdown blocks (```json).
        2. Do NOT use raw newlines inside the "answer" string. You MUST use \\n for line breaks.
        3. Format your output exactly like this:
        {{
            "answer": "Your detailed response here...",
            "visual_keyword": "keyword"
        }}
        """

        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                response = await self.client.aio.models.generate_content(
                    model=self.model,
                    contents=json_prompt,
                    config=types.GenerateContentConfig(
                        temperature=settings.TEMPERATURE,
                        max_output_tokens=settings.MAX_TOKENS,
                        top_p=settings.TOP_P,
                        response_mime_type="application/json" 
                    )
                )
                
                # FIX 2: Clean the response text before parsing just in case Gemini hallucinates markdown
                raw_text = response.text
                if raw_text.startswith("```"):
                    raw_text = re.sub(r'^```json\n?|^```\n?', '', raw_text)
                    raw_text = re.sub(r'\n?```$', '', raw_text).strip()
                
                # Strict JSON parsing
                result = json.loads(raw_text)
                return result.get("answer", "Hey love! My brain had a tiny hiccup!"), result.get("visual_keyword", "none")
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Gemini API error (Attempt {attempt + 1}/{max_retries}): {error_msg}")
                
                if "503" in error_msg and attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    continue
                
                # Fallback on parsing failure
                if attempt == max_retries - 1:
                    fallback_msg = ("Hey love! 💕 I have a great meal plan for you, but my brain got a little tangled formatting it. "
                                    "Try asking me for something specific, like 'Give me a PCOS-friendly breakfast recipe'!")
                    return fallback_msg, "none"

    async def extract_visual_keyword(self, user_message: str, graph_context: list) -> str:
        """A lightning-fast call used ONLY to get an image keyword before starting a stream."""
        context_text = self._format_context(graph_context)
        
        prompt = f"""Based on this user query: "{user_message}" and this context: {context_text}
        Provide ONLY a single 1-2 word search term for a stock photo (e.g., "healthy diet", "yoga", "sleep").
        Do not output any other text."""
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1, # Low temperature for highly deterministic, fast output
                    max_output_tokens=10 # Extreme limit for speed
                )
            )
            return response.text.strip().replace('"', '')
        except Exception:
            return "none"

    async def stream_response(self, 
                             user_message: str, 
                             graph_context: list,
                             conversation_history: list = None):
        """Stream response for real-time feel"""
        
        context_text = self._format_context(graph_context)
        
        full_prompt = f"""{self.system_prompt}

Context from knowledge graph:
{context_text}

User: {user_message}

Respond warmly with emojis and practical advice:"""

        try:
            # Using .aio.models.generate_content_stream for async generator
            response = await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=settings.TEMPERATURE,
                    max_output_tokens=settings.MAX_TOKENS,
                    top_p=settings.TOP_P
                )
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            yield "Oops! Connection hiccup - but I'm still here for you! 💫"

    def _format_context(self, graph_data: list) -> str:
        """Make graph data readable for Gemini"""
        if not graph_data:
            return "No specific data found - use general PCOS nutrition knowledge with a warm tone."
        
        lines = []
        for item in graph_data[:5]:  # Limit to top 5 for token efficiency
            if "food" in item:
                line = f"• Food: {item['food']}"
                if "description" in item:
                    line += f" - {item['description']}"
                if "how_it_helps" in item:
                    line += f"\n  Helps: {item['how_it_helps']}"
                if "nutrients" in item:
                    nutrients = [n.get("nutrient") for n in item["nutrients"] if n.get("nutrient")]
                    if nutrients:
                        line += f"\n  Contains: {', '.join(nutrients[:3])}"
                lines.append(line)
                
            elif "plan_name" in item:
                lines.append(f"• Meal Plan: {item['plan_name']}")
                if "description" in item:
                    lines.append(f"  {item['description']}")
                if "duration" in item:
                    lines.append(f"  {item['duration']} days")
                    
            elif "type" in item:
                lines.append(f"• {item['type']}: {item['name']}")
                
            lines.append("")  # spacing
        
        return "\n".join(lines)

# Singleton instance
llm_service = LLMService()