import httpx
import logging
from core.config import settings

logger = logging.getLogger(__name__)

class ImageService:
    @staticmethod
    async def get_lifestyle_image(keyword: str) -> str | None:
        """
        Fetches a relevant, high-quality image URL from Unsplash asynchronously.
        Returns None if no image is found or if the API call fails.
        """
        if not keyword or keyword.lower() == "none":
            return None

        url = "https://api.unsplash.com/search/photos"
        
        # Adding context to ensure the image fits the medical/lifestyle theme
        refined_query = f"{keyword} healthy lifestyle"
        
        params = {
            "query": refined_query,
            "client_id": settings.UNSPLASH_ACCESS_KEY,
            "per_page": 1,
            "orientation": "landscape",
            "content_filter": "high" # Ensures family-friendly, safe images
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("results"):
                    return data["results"][0]["urls"]["regular"]
                    
        except httpx.HTTPError as e:
            logger.error(f"Unsplash API HTTP error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching image: {e}")
            
        return None