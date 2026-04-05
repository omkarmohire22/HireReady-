import os
from sentence_transformers import SentenceTransformer, util
import numpy as np

# Suppress Hugging Face token warnings if token is not present
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class SkillMatcherService:
    def __init__(self):
        """
        Initializes the Skill Matcher.
        Loads the pre-trained all-MiniLM-L6-v2 model locally.
        No internet is needed after the first run downloads it to cache.
        """
        try:
            print("Loading SentenceTransformer model locally...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Failed to load sentence transformer model: {e}")
            self.model = None

    def calculate_skill_gap(self, parsed_resume_skills: list, required_skills: list, threshold: float = 0.5) -> dict:
        """
        Compares the skills extracted from the resume against the role's required skills.
        Uses cosine similarity of vector embeddings to find semantic matches,
        so "Node.js" matches "Node" or "React.js" matches "React".
        """
        if not self.model:
            return {"error": "Sentence Transformer model is not loaded."}
            
        if not parsed_resume_skills or not required_skills:
            return {"error": "Both resume skills and required skills must be provided."}

        missing_skills = []
        matched_skills = []
        
        # Combine parsed resume skills into one descriptive string to get context,
        # or we could embed each separately. For precision on technical skills, 
        # embedding each separately and checking against the pool is better.
        # But per the project plan, we compare meaning.
        
        # 1. Generate embeddings for all resume skills
        resume_embeddings = self.model.encode(parsed_resume_skills, convert_to_tensor=True)
        
        # 2. Iterate through required skills and see if they exist in the resume
        for req_skill in required_skills:
            # Generate embedding for the specific required skill
            req_embedding = self.model.encode(req_skill, convert_to_tensor=True)
            
            # 3. Calculate cosine similarity against all resume skills
            # util.cos_sim returns a matrix, we get the max similarity score
            cos_scores = util.cos_sim(req_embedding, resume_embeddings)[0]
            max_score = cos_scores.max().item()
            
            # 4. If the max semantic similarity is below the threshold, it's a missing skill
            if max_score >= threshold:
                matched_skills.append({
                    "skill": req_skill,
                    "score": round(max_score * 100, 2)
                })
            else:
                missing_skills.append(req_skill)
                
        # 5. Calculate overall match percentage
        total_required = len(required_skills)
        total_matched = len(matched_skills)
        overall_match_score = round((total_matched / total_required) * 100, 2) if total_required > 0 else 0

        return {
            "overall_match_score": overall_match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        }
