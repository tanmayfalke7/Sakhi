# app/services/extractor.py
import re
from services.dictionary import SYMPTOM_MAP, INTENT_MAP

class QueryExtractor:
    @staticmethod
    def extract_entities(user_message: str) -> dict:
        """
        Scans the user message against local dictionaries to find intents and symptoms.
        Executes in ~0.001 seconds (Free).
        """
        # Convert to lowercase and remove punctuation for cleaner matching
        clean_text = re.sub(r'[^\w\s]', '', user_message.lower())
        
        detected_symptoms = []
        intent = "symptom_help" # Default intent
        
        # 1. Detect Symptoms
        for exact_node_name, synonyms in SYMPTOM_MAP.items():
            if any(synonym in clean_text for synonym in synonyms):
                detected_symptoms.append(exact_node_name)
                
        # 2. Detect Intent (Avoidance vs Meal Plan)
        for intent_name, keywords in INTENT_MAP.items():
            if any(keyword in clean_text for keyword in keywords):
                intent = intent_name
                break # Stop at first matched intent
                
        return {
            "intent": intent,
            "symptoms": detected_symptoms
        }

query_extractor = QueryExtractor()