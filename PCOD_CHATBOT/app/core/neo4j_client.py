from neo4j import AsyncGraphDatabase, AsyncDriver
from .config import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.driver: Optional[AsyncDriver] = None
        
    async def connect(self):
        """Initialize Neo4j connection"""
        self.driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        # Verify connection
        await self.driver.verify_connectivity()
        logger.info("✅ Connected to Neo4j")
        
    async def close(self):
        """Close Neo4j connection"""
        if self.driver:
            await self.driver.close()
            logger.info("🔌 Neo4j connection closed")
            
    async def run_query(self, query: str, parameters: dict = None):
        """Execute a Cypher query and return results"""
        async with self.driver.session() as session:
            result = await session.run(query, parameters or {})
            return await result.data()

# Singleton instance
neo4j_client = Neo4jClient()