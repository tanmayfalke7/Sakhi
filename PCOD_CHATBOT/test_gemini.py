# test_gemini.py
import asyncio
from app.services.llm_service import llm_service

async def test_gemini():
    # Mock graph context
    test_context = [
        {
            "food": "Salmon",
            "description": "Omega-3 rich fish",
            "how_it_helps": "Reduces inflammation that causes acne",
            "nutrients": [{"nutrient": "Omega-3"}, {"nutrient": "Vitamin D"}]
        },
        {
            "food": "Spinach", 
            "description": "Leafy green",
            "how_it_helps": "Magnesium helps balance hormones",
            "nutrients": [{"nutrient": "Magnesium"}, {"nutrient": "Iron"}]
        }
    ]
    
    # Test question
    response = await llm_service.generate_response(
        user_message="What foods help with PCOS acne?",
        graph_context=test_context
    )
    
    print("🤖 Gemini Response:")
    print("-" * 50)
    print(response)
    print("-" * 50)

# Run test
asyncio.run(test_gemini())
