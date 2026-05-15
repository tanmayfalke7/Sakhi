import re

from services.dictionary import INTENT_MAP, SYMPTOM_MAP

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
        intent = "symptom_help"
        
        # 1. Detect Symptoms
        for exact_node_name, synonyms in SYMPTOM_MAP.items():
            if any(synonym in clean_text for synonym in synonyms):
                detected_symptoms.append(exact_node_name)
                
        # Detect the strongest intent. Meal-plan queries should win when the
        # user asks for a diet plan even if symptom words are also present.
        for intent_name, keywords in INTENT_MAP.items():
            if any(keyword in clean_text for keyword in keywords):
                intent = intent_name
                break
                
        return {
            "intent": intent,
            "symptoms": detected_symptoms
        }

query_extractor = QueryExtractor()
