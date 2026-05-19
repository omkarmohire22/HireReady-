import re
import os
import json
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List, Dict, Any
import spacy

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

try:
    nlp = spacy.load("en_core_web_md")
except OSError:
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        nlp = None

class FeedbackScorerService:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.filler_words = {"um", "uh", "like", "basically", "you know", "actually", "literally", "sort of", "kind of"}
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        if HAS_GENAI and self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.llm = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.llm = None

    def count_fillers(self, answer_text: str) -> int:
        count = 0
        text_lower = answer_text.lower()
        for filler in self.filler_words:
            matches = re.findall(rf"\b{filler}\b", text_lower)
            count += len(matches)
        return count

    def score(self, answer_text: str, question_text: str, expected_keywords: List[str], difficulty: str) -> Dict[str, Any]:
        if not answer_text or answer_text.strip() == "":
            return {
                "score": 0.0,
                "feedback": "You did not provide an answer.",
                "strengths": [],
                "improvements": ["Try to provide a complete answer next time."],
                "keywords_used": [],
                "keywords_missed": expected_keywords,
                "filler_word_count": 0
            }

        answer_lower = answer_text.strip().lower()
        question_lower = question_text.strip().lower()

        # Check for explicit "No answer", "Skipped", "No verbal response detected", etc.
        no_answer_indicators = [
            "no verbal response detected", "no response", "no answer", "skip", "skipped",
            "nothing", "none", "no verbal response", "i don't have an answer", 
            "i do not have an answer", "don't have an answer", "don't have any answer",
            "i have no answer", "i do not have any answer"
        ]
        
        # Ignorance / evasion check
        ignorance_phrases = [
            "i don't know", "i do not know", "i have no idea", "i don't have an idea",
            "not sure", "i am not sure", "i'm not sure", "cannot answer", "can't answer",
            "no idea", "don't have any idea"
        ]
        
        is_no_answer = any(indicator in answer_lower for indicator in no_answer_indicators)
        is_ignorant = any(phrase in answer_lower for phrase in ignorance_phrases)

        # Repetition / Evasion Check (if they copied major parts of the question)
        from difflib import SequenceMatcher
        similarity_to_question = SequenceMatcher(None, answer_lower, question_lower).ratio()
        is_repetitive = similarity_to_question > 0.6 or question_lower in answer_lower

        if is_no_answer or is_ignorant or is_repetitive:
            feedback = "You did not provide a valid answer to this question."
            if is_ignorant:
                feedback = "You indicated you didn't know the answer. Try to discuss related concepts next time."
            elif is_repetitive:
                feedback = "Your answer repeated the question prompt without adding any meaningful technical content."
            
            return {
                "score": 0.0,
                "feedback": feedback,
                "strengths": [],
                "improvements": ["Try to formulate a structured answer addressing the question prompt directly."],
                "keywords_used": [],
                "keywords_missed": expected_keywords,
                "filler_word_count": 0
            }

        # Optional: Perfect LLM Factual Evaluation
        if self.llm:
            try:
                return self._evaluate_with_llm(answer_text, question_text, expected_keywords, difficulty)
            except Exception as e:
                print(f"[FeedbackScorer] LLM evaluation failed, falling back to NLP. Error: {e}")

        # Semantic processing
        ans_doc = nlp(answer_text) if nlp else None
        q_doc = nlp(question_text) if nlp else None

        # 1. Keyword matching (40% weight)
        keywords_used = []
        keywords_missed = []
        for kw in expected_keywords:
            if kw.lower() in answer_lower:
                keywords_used.append(kw)
            elif nlp:
                # Fuzzy semantic match for keywords
                kw_doc = nlp(kw)
                if kw_doc.vector_norm and ans_doc and ans_doc.vector_norm:
                    sim = ans_doc.similarity(kw_doc)
                    if sim > 0.4:
                        keywords_used.append(kw)
                    else:
                        keywords_missed.append(kw)
                else:
                    keywords_missed.append(kw)
            else:
                keywords_missed.append(kw)
                
        keyword_score = len(keywords_used) / len(expected_keywords) if expected_keywords else 1.0

        # 2. Length/Depth (20% weight)
        word_count = len(answer_text.split())
        target_wc = {"Easy": 30, "Medium": 60, "Hard": 100}.get(difficulty, 60)
        depth_score = min(word_count / target_wc, 1.0)

        # 3. Sentiment (Confidence) (10% weight)
        sentiment = self.analyzer.polarity_scores(answer_text)
        sentiment_score = 1.0 if sentiment['compound'] > -0.2 else 0.5 

        # 4. Filler penalty (10% weight)
        fillers = self.count_fillers(answer_text)
        filler_penalty = min(fillers / 10.0, 0.5)
        filler_score = 1.0 - filler_penalty

        # 5. Question Relevance (20% weight)
        relevance_score = 0.5 # default
        if ans_doc and q_doc and ans_doc.vector_norm and q_doc.vector_norm:
            relevance_score = ans_doc.similarity(q_doc)
            # Normalizing relevance: 0.3 similarity is quite related in some contexts
            relevance_score = min(max((relevance_score - 0.2) / 0.6, 0.0), 1.0)

        final_score = (
            (keyword_score * 0.40) +
            (depth_score * 0.20) +
            (sentiment_score * 0.10) +
            (filler_score * 0.10) +
            (relevance_score * 0.20)
        ) * 100

        # Apply severe penalties for non-answers
        if is_ignorant:
            final_score = 0.0
        elif is_repetitive:
            final_score = 0.0

        strengths = []
        improvements = []
        
        if is_ignorant:
            improvements.append("You indicated you didn't know the answer. It's okay to admit, but try to talk about related concepts you do know.")
        elif is_repetitive:
            improvements.append("Your answer heavily repeated the question without adding new information.")
        else:
            if keyword_score > 0.7:
                strengths.append("Excellent use of technical terminology.")
            elif keyword_score < 0.4:
                improvements.append(f"Consider mentioning these key concepts: {', '.join(keywords_missed[:3])}.")
            
        if fillers > 3:
            improvements.append("Try to reduce filler words (like 'um', 'uh', 'you know') to sound more confident.")
            
        if depth_score < 0.5:
            improvements.append("Your answer was a bit brief. Try elaborating on your explanation.")
        elif depth_score >= 0.9:
            strengths.append("Provided a thoroughly detailed answer.")
            
        return {
            "score": round(final_score, 2),
            "feedback": "Good effort! " + (" ".join(improvements) if improvements else "Solid answer."),
            "strengths": strengths,
            "improvements": improvements,
            "keywords_used": keywords_used,
            "keywords_missed": keywords_missed,
            "filler_word_count": fillers
        }

    def _evaluate_with_llm(self, answer_text: str, question_text: str, expected_keywords: List[str], difficulty: str) -> Dict[str, Any]:
        prompt = f"""
        You are an expert technical interviewer. Evaluate the candidate's answer to the following question.
        
        Question: "{question_text}"
        Difficulty: {difficulty}
        Candidate's Answer: "{answer_text}"
        
        Analyze the answer for FACTUAL CORRECTNESS, depth, and clarity. Do NOT just check for keywords. The answer must actually be correct.
        Provide a JSON response strictly in the following format, with no markdown formatting or backticks:
        {{
            "score": <int from 0 to 100 based heavily on correctness>,
            "feedback": "<2-3 sentences of constructive feedback explaining why it's right or wrong>",
            "strengths": ["<strength 1>", "<strength 2>"],
            "improvements": ["<improvement 1>", "<improvement 2>"],
            "keywords_used": {json.dumps(expected_keywords)},
            "keywords_missed": []
        }}
        """
        response = self.llm.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        raw_data = json.loads(text.strip())
        
        # Sanitize LLM response to ensure complete fields and correct types
        data = {
            "score": float(raw_data.get("score", 70.0)),
            "feedback": str(raw_data.get("feedback", "Good effort!")),
            "strengths": list(raw_data.get("strengths", []) or []),
            "improvements": list(raw_data.get("improvements", []) or []),
            "keywords_used": list(raw_data.get("keywords_used", expected_keywords) or []),
            "keywords_missed": list(raw_data.get("keywords_missed", []) or [])
        }
        
        data["filler_word_count"] = self.count_fillers(answer_text)
        
        # Apply filler penalty
        filler_penalty = min(data["filler_word_count"] / 10.0, 0.5) * 10
        data["score"] = max(0.0, min(100.0, round(data["score"] - filler_penalty, 2)))
        return data
