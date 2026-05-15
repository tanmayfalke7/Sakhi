import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.extractor import query_extractor
from services.graph_service import graph_service
from services.image_service import ImageService
from services.llm_service import llm_service
from services.response_formatter import response_formatter

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_id: Optional[str] = None
    symptoms: Optional[List[str]] = None
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    success: bool = True
    response: str
    metadata: Dict[str, Any]
    suggested_actions: List[Dict[str, str]]
    graph_data: List[Dict[str, Any]] = []
    image_url: Optional[str] = None


async def _get_graph_context(message: str, symptoms: Optional[List[str]] = None) -> tuple[list, dict]:
    extracted = query_extractor.extract_entities(message)
    intent = extracted["intent"]
    detected_symptoms = symptoms or extracted["symptoms"]
    graph_context: list = []

    if intent == "symptom_help" and detected_symptoms:
        for symptom in detected_symptoms:
            graph_context.extend(await graph_service.get_foods_by_symptom(symptom))
    elif intent == "food_avoidance" and detected_symptoms:
        for symptom in detected_symptoms:
            graph_context.extend(await graph_service.get_foods_to_avoid(symptom))
    elif intent == "meal_plan":
        plans = await graph_service.get_meal_plan_for_symptoms(detected_symptoms)
        if not plans:
            plans = await graph_service.get_default_meal_plans()
        graph_context.extend(plans)
    else:
        graph_context.extend(await graph_service.hybrid_search(message))

    return graph_context, {"intent": intent, "symptoms": detected_symptoms}


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        graph_context, route_metadata = await _get_graph_context(request.message, request.symptoms)
        llm_text, visual_keyword = await llm_service.generate_response_with_keyword(
            user_message=request.message,
            graph_context=graph_context,
            conversation_history=request.history,
        )

        image_url = None
        if visual_keyword and visual_keyword != "none":
            image_url = await ImageService.get_lifestyle_image(visual_keyword)

        formatted = response_formatter.format_chat_response(llm_text, graph_context)
        formatted["metadata"].update(route_metadata)
        return ChatResponse(**formatted, image_url=image_url)
    except HTTPException:
        raise
    except Exception as error:
        logger.error("Chat route failed: %s", error, exc_info=True)
        raise


@router.post("/stream")
async def stream_chat(request: ChatRequest):
    async def generate():
        try:
            graph_context, _ = await _get_graph_context(request.message, request.symptoms)
            visual_keyword = await llm_service.extract_visual_keyword(request.message, graph_context)
            if visual_keyword and visual_keyword != "none":
                image_url = await ImageService.get_lifestyle_image(visual_keyword)
                if image_url:
                    yield f"data: {json.dumps({'type': 'image', 'url': image_url})}\n\n"

            async for token in llm_service.stream_response(
                user_message=request.message,
                graph_context=graph_context,
                conversation_history=request.history,
            ):
                yield f"data: {json.dumps({'type': 'text', 'content': token})}\n\n"
        except Exception as error:
            logger.error("Streaming route failed: %s", error, exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'content': 'Chat service is temporarily unavailable.'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
