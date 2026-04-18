from typing import List, Dict, Any
import json

class PromptService:
    """Build engaging prompts for the LLM"""
    
    # System prompt that sets the tone - friendly, empowering, engaging for young women
    SYSTEM_PROMPT = """You are Glow, a warm, knowledgeable, and empowering nutrition coach specializing in PCOS for young women (18-27). 

YOUR PERSONALITY:
- Warm and friendly like a big sister who's been through it
- Empowering and body-positive - no shame, no judgment
- Uses casual, modern language with emojis occasionally ✨
- Excited about food as fuel and self-care
- Honest but never scary about PCOS realities
- Celebrates small wins and progress

YOUR VOICE:
- Use "hey love", "beautiful", "gorgeous" occasionally (not every sentence)
- Sprinkle in phrases like: "you got this", "your body is amazing", "small steps = big changes"
- Be relatable: "girl, I feel you", "been there", "same same"
- Use emojis naturally: 🥑 for healthy fats, 💪 for strength, ✨ for glow-ups, 🌸 for self-care
- Keep sentences varied - some short and punchy, some detailed

RESPONSE STRUCTURE (when appropriate):
1. Warm opening - acknowledge their question/feeling
2. The insight - what the science says (from our knowledge graph)
3. Practical tips - how to apply it TODAY
4. Encouraging close - make them feel empowered

KNOWLEDGE INTEGRATION:
Always base your answers on the graph data provided. If the user asks something outside this data, gently guide them back to PCOS nutrition topics.

EXAMPLE TONE:
User: "I'm so tired of having acne from PCOS"
Bad: "Acne is caused by androgen hormones. Consider anti-inflammatory foods."
Good: "Ugh, acne is the WORST. I totally get the frustration, beautiful. 💫 The good news? What we eat can actually help calm those breakouts. From our PCOS knowledge base, foods rich in omega-3s (like salmon, walnuts, chia seeds) help reduce inflammation that triggers acne. Let me share exactly how to work these into your week..." """

    @classmethod
    def build_chat_prompt(cls, 
                          user_message: str, 
                          graph_context: List[Dict],
                          conversation_history: List[Dict] = None) -> List[Dict]:
        """Build the messages array for the LLM"""
        
        messages = [
            {"role": "system", "content": cls.SYSTEM_PROMPT}
        ]
        
        # Add conversation history (last 5 exchanges)
        if conversation_history:
            for msg in conversation_history[-5:]:
                messages.append(msg)
        
        # Format graph data for the LLM
        context_text = cls._format_graph_context(graph_context)
        
        # Construct the user prompt with context
        user_prompt = f"""Here's what I found in our PCOS nutrition knowledge graph about your question:

{context_text}

Now, please answer this question from a young woman with PCOS:
"{user_message}"

Remember to use our warm, encouraging tone and make the answer practical and engaging!"""
        
        messages.append({"role": "user", "content": user_prompt})
        
        return messages
    
    @classmethod
    def _format_graph_context(cls, graph_data: List[Dict]) -> str:
        """Format graph query results into readable context"""
        if not graph_data:
            return "No specific data found in knowledge graph for this query."
        
        formatted = []
        
        for item in graph_data:
            if "food" in item:
                formatted.append(f"• Food: {item['food']}")
                if "description" in item:
                    formatted.append(f"  - {item['description']}")
                if "how_it_helps" in item:
                    formatted.append(f"  - Helps with: {item['how_it_helps']}")
                if "nutrients" in item and item["nutrients"]:
                    nutrients = [n["nutrient"] for n in item["nutrients"] if n.get("nutrient")]
                    formatted.append(f"  - Key nutrients: {', '.join(nutrients[:3])}")
                    
            elif "plan_name" in item:
                formatted.append(f"• Meal Plan: {item['plan_name']}")
                formatted.append(f"  - {item['description']}")
                formatted.append(f"  - Duration: {item['duration']} days")
                
            elif "type" in item:
                formatted.append(f"• {item['type']}: {item['name']}")
                if "description" in item:
                    formatted.append(f"  - {item['description']}")
                    
            formatted.append("")  # spacing
        
        return "\n".join(formatted)

prompt_service = PromptService()