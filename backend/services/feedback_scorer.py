import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List, Dict, Any

class FeedbackScorerService:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.filler_words = {"um", "uh", "like", "basically", "you know", "actually", "literally", "sort of", "kind of"}

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

        answer_lower = answer_text.lower()
        
        # 1. Keyword matching (40% weight)
        keywords_used = []
        keywords_missed = []
        for kw in expected_keywords:
            if kw.lower() in answer_lower:
                keywords_used.append(kw)
            else:
                keywords_missed.append(kw)
                
        keyword_score = len(keywords_used) / len(expected_keywords) if expected_keywords else 1.0

        # 2. Length/Depth (20% weight)
        word_count = len(answer_text.split())
        target_wc = {"Easy": 30, "Medium": 60, "Hard": 100}.get(difficulty, 60)
        depth_score = min(word_count / target_wc, 1.0)

        # 3. Sentiment (Confidence) (20% weight)
        sentiment = self.analyzer.polarity_scores(answer_text)
        sentiment_score = 1.0 if sentiment['compound'] > -0.2 else 0.5 

        # 4. Filler penalty (10% weight)
        fillers = self.count_fillers(answer_text)
        filler_penalty = min(fillers / 10.0, 0.5)
        filler_score = 1.0 - filler_penalty

        # 5. Question Relevance (10% weight)
        relevance_score = 1.0

        final_score = (
            (keyword_score * 0.40) +
            (depth_score * 0.20) +
            (sentiment_score * 0.20) +
            (filler_score * 0.10) +
            (relevance_score * 0.10)
        ) * 100

        strengths = []
        improvements = []
        
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
