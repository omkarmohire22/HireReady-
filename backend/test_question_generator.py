import unittest
from services.question_generator import QuestionGeneratorService, normalize_role, normalize_difficulty, normalize_session_type

class TestQuestionGeneratorService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.generator = QuestionGeneratorService()

    def test_role_normalization(self):
        """Verify that various frontend role representations are mapped correctly to canonical database roles."""
        self.assertEqual(normalize_role("full stack dev"), "Full Stack Developer")
        self.assertEqual(normalize_role("backend engineer"), "Backend Developer")
        self.assertEqual(normalize_role("ML Engineer"), "ML Engineer")
        self.assertEqual(normalize_role("frontend developer"), "Frontend Developer")
        # Unmapped roles should stay as-is
        self.assertEqual(normalize_role("Unknown Role"), "Unknown Role")

    def test_difficulty_normalization(self):
        """Verify that difficulty level strings are cleaned and normalized."""
        self.assertEqual(normalize_difficulty("easy"), "Easy")
        self.assertEqual(normalize_difficulty("Medium"), "Medium")
        self.assertEqual(normalize_difficulty("HARD"), "Hard")
        self.assertEqual(normalize_difficulty("invalid_difficulty"), "Medium")

    def test_session_type_normalization(self):
        """Verify that interview types from the frontend map correctly."""
        self.assertEqual(normalize_session_type("technical"), "technical")
        self.assertEqual(normalize_session_type("behavioural"), "behavioural")
        self.assertEqual(normalize_session_type("behavioral"), "behavioural")
        self.assertEqual(normalize_session_type("system design"), "system_design")

    def test_question_selection_by_difficulty(self):
        """Verify that requesting different difficulties yields corresponding difficulty levels."""
        r_easy = self.generator.generate_question("React", "Frontend Developer", difficulty="Easy")
        r_hard = self.generator.generate_question("React", "Frontend Developer", difficulty="Hard")
        
        self.assertEqual(r_easy["difficulty"], "Easy")
        self.assertEqual(r_hard["difficulty"], "Hard")
        
        # Verify that questions generated are actually different
        self.assertNotEqual(r_easy["generated_question"], r_hard["generated_question"])

    def test_anti_repetition_logic(self):
        """Verify that excluding previous questions strictly avoids repetition."""
        skill = "React"
        role = "Frontend Developer"
        
        # Generate initial question
        res1 = self.generator.generate_question(skill, role, difficulty="Easy")
        q1 = res1["generated_question"]
        
        # Generate with exclude containing the first question
        res2 = self.generator.generate_question(skill, role, exclude=[q1], difficulty="Easy")
        q2 = res2["generated_question"]
        
        self.assertNotEqual(q1, q2)
        
        # Generate with multiple exclusions
        res3 = self.generator.generate_question(skill, role, exclude=[q1, q2], difficulty="Easy")
        q3 = res3["generated_question"]
        
        self.assertNotIn(q3, [q1, q2])

    def test_csv_dataset_fallback(self):
        """Verify that the generator falls back to the dataset when not in the curated bank."""
        # 'Pandas' is not in the curated QUESTION_BANK, but is in the CSV dataset
        res = self.generator.generate_question("Pandas", "Data Analyst", difficulty="Medium", session_type="technical")
        
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["skill_targeted"], "Pandas")
        self.assertTrue(len(res["generated_question"]) > 0)

if __name__ == "__main__":
    unittest.main()
