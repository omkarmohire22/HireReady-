import os
import re
import spacy
from pdfminer.high_level import extract_text

# Load the base english model (we'll fine-tune this later for custom NER)
# Since the download might not be complete yet during setup, we handle errors gracefully
try:
    nlp = spacy.load("en_core_web_sm") # Will eventually be replaced by the custom trained model
except OSError:
    # Fallback to basic regex if model is not yet downloaded
    nlp = None

class ResumeParserService:
    def __init__(self):
        # A basic dictionary to act as a placeholder before the ML NER is fully trained
        self.basic_skills_dict = [
            "python", "react", "mongodb", "fastapi", "node.js", 
            "javascript", "typescript", "java", "c++", "sql", 
            "docker", "kubernetes", "aws", "machine learning", "docker"
        ]

    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extracts raw text from a PDF file using pdfminer.six.
        """
        try:
            text = extract_text(file_path)
            # Clean up the text (remove excessive newlines and spaces)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            return ""

    def extract_skills_with_ner(self, text: str) -> list:
        """
        Uses spaCy (or dictionary fallback) to find technical skills in the text.
        This represents Model 1 (spaCy Custom NER) in the project plan.
        """
        found_skills = set()
        text_lower = text.lower()
        
        # 1. Dictionary/Regex fallback phase
        for skill in self.basic_skills_dict:
            # Using regex with word boundaries to avoid partial matches (e.g., 'react' in 'reaction')
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                found_skills.add(skill)

        # 2. NLP Named Entity Recognition (NER) phase
        # Once the custom spaCy model is trained, it will look for the 'SKILL' label
        if nlp:
            doc = nlp(text)
            for ent in doc.ents:
                # In the custom trained model, we will check if ent.label_ == 'SKILL'
                if ent.label_ == 'SKILL':
                    found_skills.add(ent.text.lower())
                    
        return list(found_skills)

    def process_resume(self, file_path: str) -> dict:
        """
        Full pipeline: Upload -> PDF parsing -> NER skill extraction -> JSON Object.
        """
        raw_text = self.extract_text_from_pdf(file_path)
        
        if not raw_text:
            return {"error": "Could not extract text from the provided file."}
        
        skills = self.extract_skills_with_ner(raw_text)
        
        # For now, we mock experience and education extraction
        # Later, these will also be extracted using specific regex or standard NER models
        return {
            "skills": skills,
            "experience": "Not yet parsed - mock",
            "education": "Not yet parsed - mock",
            "raw_text_length": len(raw_text)
        }
