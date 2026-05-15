import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from api.routes import chat, foods, meal_plans, predict
from core.config import settings
from core.neo4j_client import neo4j_client

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    await neo4j_client.connect()
    yield
    await neo4j_client.close()
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="PCOS nutrition chatbot API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Invalid request data.",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Neo4jError)
@app.exception_handler(ServiceUnavailable)
async def database_exception_handler(request: Request, exc: Exception):
    logger.error("Database error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={
            "success": False,
            "message": "Knowledge graph is temporarily unavailable. Please try again soon.",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Something went wrong. Please try again soon.",
        },
    )


app.include_router(predict.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(meal_plans.router, prefix="/api/v1")
app.include_router(foods.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "PCOS Nutrition Chatbot API is running.",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    graph = await neo4j_client.health()
    return {
        "success": graph["connected"],
        "status": "healthy" if graph["connected"] else "degraded",
        "database": graph,
        "llm_provider": settings.LLM_PROVIDER,
        "model": settings.GEMINI_MODEL,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
