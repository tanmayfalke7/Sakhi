from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import json

from services.graph_service import graph_service
from services.llm_service import llm_service
from services.response_formatter import response_formatter
from services.image_service import ImageService  # NEW: Import the image service
from services.extractor import query_extractor
router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)

# --- PYDANTIC MODELS ---

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    symptoms: Optional[List[str]] = None
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    metadata: Dict[str, Any]
    suggested_actions: List[Dict[str, str]]
    graph_data: Optional[List[Dict]] = None
    image_url: Optional[str] = None  # NEW: Added to support frontend rendering

# --- ROUTES ---
@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - processes user message, fetches graph data via 
    heuristic extraction, generates LLM response, and attaches an image.
    """
    try:
        user_message = request.message
        logger.info(f"Processing chat: {user_message[:50]}...")
        
        # ---------------------------------------------------------
        # STEP 1: Fast Heuristic Entity Extraction (O(1) Time)
        # ---------------------------------------------------------
        extracted_data = query_extractor.extract_entities(user_message)
        logger.info(f"Extracted Entities: {extracted_data}")
        
        intent = extracted_data["intent"]
        detected_symptoms = extracted_data["symptoms"]
        
        graph_context = []
        
        # ---------------------------------------------------------
        # STEP 2: Dynamic Graph Routing
        # ---------------------------------------------------------
        if intent == "symptom_help" and detected_symptoms:
            for symptom in detected_symptoms:
                foods = await graph_service.get_foods_by_symptom(symptom)
                graph_context.extend(foods)
                
        elif intent == "food_avoidance" and detected_symptoms:
            for symptom in detected_symptoms:
                avoid = await graph_service.get_foods_to_avoid(symptom)
                graph_context.extend(avoid)
                
        elif intent == "meal_plan":
            if detected_symptoms:
                plans = await graph_service.get_meal_plan_for_symptoms(detected_symptoms)
                graph_context.extend(plans)
            else:
                # Fallback to a general, safe PCOS diet search
                search_results = await graph_service.hybrid_search("PCOS balanced meal plan")
                graph_context.extend(search_results)
                
        else: 
            # general_query fallback
            search_results = await graph_service.hybrid_search(user_message)
            graph_context.extend(search_results)

        # ---------------------------------------------------------
        # STEP 3: Context-Augmented Generation
        # ---------------------------------------------------------
        llm_text, visual_keyword = await llm_service.generate_response_with_keyword(
            user_message=user_message,
            graph_context=graph_context
        )
        
        # ---------------------------------------------------------
        # STEP 4: Asynchronous Multimodal Augmentation (Image)
        # ---------------------------------------------------------
        image_url = None
        if visual_keyword and visual_keyword.lower() != "none":
            image_url = await ImageService.get_lifestyle_image(visual_keyword)
        
        # ---------------------------------------------------------
        # STEP 5: Format and Return
        # ---------------------------------------------------------
        formatted = response_formatter.format_chat_response(llm_text, graph_context)
        
        return ChatResponse(
            **formatted,
            image_url=image_url
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong, but we're on it! ✨")
# @router.post("", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     """
#     Main chat endpoint - processes user message, fetches graph data, 
#     generates LLM response, and attaches a dynamic lifestyle image.
#     """
#     try:
#         user_message = request.message
#         logger.info(f"Processing chat: {user_message[:50]}...")
        
#         # Step 1: Query the knowledge graph based on user message
#         graph_context = []
        
#         # Check if they're asking about symptoms
#         if any(word in user_message.lower() for word in ["help", "symptom", "acne", "fatigue", "weight", "period"]):
#             symptoms_to_check = ["Acne", "Fatigue", "Weight Gain", "Insulin Resistance", "Irregular Periods"]
#             for symptom in symptoms_to_check:
#                 if symptom.lower() in user_message.lower():
#                     foods = await graph_service.get_foods_by_symptom(symptom)
#                     graph_context.extend(foods)
        
#         # Check if they're asking about foods to avoid
#         elif any(word in user_message.lower() for word in ["avoid", "bad", "worsen", "stop"]):
#             symptoms_to_check = ["Acne", "Fatigue", "Weight Gain", "Insulin Resistance"]
#             for symptom in symptoms_to_check:
#                 if symptom.lower() in user_message.lower():
#                     avoid = await graph_service.get_foods_to_avoid(symptom)
#                     graph_context.extend(avoid)
        
#         # Check if they're asking about meal plans
#         elif any(word in user_message.lower() for word in ["meal plan", "plan", "diet", "eat"]):
#             if request.symptoms:
#                 plans = await graph_service.get_meal_plan_for_symptoms(request.symptoms)
#                 graph_context.extend(plans)
        
#         # General search
#         else:
#             search_results = await graph_service.hybrid_search("meal plan")
#             graph_context.extend(search_results)
        
#         # Step 2: Generate LLM response and extract visual keyword
#         # Note: Ensure your llm_service.generate_response returns a tuple of (text, keyword)
#         # or adjust this line if it returns a dictionary.
#         llm_text, visual_keyword = await llm_service.generate_response_with_keyword(
#             user_message=user_message,
#             graph_context=graph_context
#         )
        
#         # Step 3: Fetch Image URL asynchronously 
#         image_url = None
#         if visual_keyword and visual_keyword.lower() != "none":
#             image_url = await ImageService.get_lifestyle_image(visual_keyword)
        
#         # Step 4: Format the response for frontend
#         formatted = response_formatter.format_chat_response(llm_text, graph_context)
        
#         # Step 5: Construct final response including the image
#         return ChatResponse(
#             **formatted,
#             image_url=image_url
#         )
        
#     except Exception as e:
#         logger.error(f"Chat error: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail="Something went wrong, but we're on it! ✨")

@router.post("/stream")
async def stream_chat(request: ChatRequest):
    """
    Streaming version for real-time response.
    Sends the image URL as a distinct Server-Sent Event (SSE) before the text streams.
    """
    from fastapi.responses import StreamingResponse
    
    async def generate():
        try:
            # Step 1: Get graph context
            graph_context = []
            if request.symptoms:
                plans = await graph_service.get_meal_plan_for_symptoms(request.symptoms)
                graph_context.extend(plans)
            
            # Step 2: Generate visual keyword quickly (optional for stream, but great for UX)
            # You might want a fast, separate LLM call here just for the keyword if streaming is blocked.
            # Assuming we can get a fast keyword:
            visual_keyword = await llm_service.extract_visual_keyword(request.message, graph_context)
            
            if visual_keyword and visual_keyword.lower() != "none":
                image_url = await ImageService.get_lifestyle_image(visual_keyword)
                if image_url:
                    # Yield the image URL as a special metadata event for the frontend to catch immediately
                    image_data = json.dumps({"type": "image", "url": image_url})
                    yield f"data: {image_data}\n\n"
            
            # Step 3: Stream the response text
            async for token in llm_service.stream_response(
                user_message=request.message,
                graph_context=graph_context,
                conversation_history=request.history
            ):
                # Standard text tokens
                yield f"data: {json.dumps({'type': 'text', 'content': token})}\n\n"
                
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")