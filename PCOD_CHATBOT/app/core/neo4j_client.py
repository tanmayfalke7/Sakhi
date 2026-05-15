import logging
from typing import Optional

from neo4j import AsyncDriver, AsyncGraphDatabase
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from core.config import settings

logger = logging.getLogger(__name__)


class Neo4jClient:
    def __init__(self):
        self.driver: Optional[AsyncDriver] = None
        self.connected = False
        self.last_error: Optional[str] = None

    async def connect(self):
        self.driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )

        try:
            await self.driver.verify_connectivity()
            self.connected = True
            self.last_error = None
            logger.info("Connected to Neo4j database '%s'", settings.NEO4J_DATABASE)
        except Exception as error:
            self.connected = False
            self.last_error = str(error)
            logger.error("Neo4j connection failed: %s", error)

    async def close(self):
        if self.driver:
            await self.driver.close()
            self.driver = None
        self.connected = False

    async def run_query(self, query: str, parameters: dict | None = None):
        if not self.driver:
            await self.connect()

        if not self.driver or not self.connected:
            raise ServiceUnavailable(self.last_error or "Neo4j is not connected")

        try:
            async with self.driver.session(database=settings.NEO4J_DATABASE) as session:
                result = await session.run(query, parameters or {})
                return await result.data()
        except (Neo4jError, ServiceUnavailable) as error:
            self.connected = False
            self.last_error = str(error)
            logger.error("Neo4j query failed: %s", error)
            raise

    async def health(self) -> dict:
        try:
            rows = await self.run_query("RETURN 1 AS ok")
            return {"connected": bool(rows), "database": settings.NEO4J_DATABASE, "error": None}
        except Exception as error:
            return {"connected": False, "database": settings.NEO4J_DATABASE, "error": str(error)}


neo4j_client = Neo4jClient()
