# app/services/dictionary.py

# Maps exact Neo4j Symptom Node Names to common user phrases/synonyms
SYMPTOM_MAP = {
    "Acne": ["acne", "pimples", "breakouts", "zits", "skin issues", "clear skin"],
    "Fatigue": ["fatigue", "tired", "exhausted", "low energy", "sleepy", "sluggish"],
    "Insulin Resistance": ["insulin", "blood sugar", "glucose", "cravings", "sugar crash"],
    "Weight Gain": ["weight", "fat", "lose weight", "heavy", "stubborn weight"],
    "Irregular Periods": ["period", "menstruation", "cycle", "late period", "missed period"],
    "Hirsutism": ["hair growth", "facial hair", "hirsutism", "shaving"]
}

# Maps intent to keywords
INTENT_MAP = {
    "meal_plan": ["meal plan", "diet", "what to eat", "recipes", "menu", "breakfast", "lunch", "dinner"],
    "food_avoidance": ["avoid", "bad for", "stop eating", "worsen", "trigger", "not eat"]
}