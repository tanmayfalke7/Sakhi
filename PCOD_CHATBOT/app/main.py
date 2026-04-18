from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from core.config import settings
from core.neo4j_client import neo4j_client
from api.routes import chat, meal_plans, foods
from api.routes import predict

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await neo4j_client.connect()
    yield
    # Shutdown
    await neo4j_client.close()
    logger.info("👋 Shutting down")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="PCOS Nutrition Chatbot - Your friendly guide to eating well with PCOS ✨",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(meal_plans.router, prefix="/api/v1")
app.include_router(foods.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "🌸 Hey gorgeous! PCOS Nutrition Chatbot API is ready to glow!",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Check if the service is healthy"""
    try:
        # Test Neo4j connection
        await neo4j_client.run_query("RETURN 1 AS test")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "llm_provider": settings.LLM_PROVIDER,
        "model": settings.LLM_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )