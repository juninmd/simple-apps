import unittest
from brasilidade.quiz import QuizEngine, QuizQuestion, QuizSession


class TestQuizEngine(unittest.TestCase):
    def setUp(self):
        self.raw_questions = [
            {
                "id": 101,
                "category": "Música",
                "question": "O que é Samba?",
                "options": ["Gênero musical", "Esporte", "Comida", "Filme"],
                "correct_index": 0,
                "explanation": "Samba é um gênero musical."
            },
            {
                "id": 102,
                "category": "Gastronomia",
                "question": "O que é Açaí?",
                "options": ["Animal", "Fruto", "Lugar", "Instrumento"],
                "correct_index": 1,
                "explanation": "Açaí é um fruto típico da Amazônia."
            }
        ]
        self.engine = QuizEngine(self.raw_questions)

    def test_get_categories(self):
        categories = self.engine.get_categories()
        self.assertEqual(categories, ["Gastronomia", "Música"])

    def test_create_session_no_filter(self):
        session = self.engine.create_session(shuffle=False)
        self.assertEqual(len(session.questions), 2)

    def test_create_session_category_filter(self):
        session = self.engine.create_session(category="Gastronomia")
        self.assertEqual(len(session.questions), 1)
        self.assertEqual(session.questions[0].category, "Gastronomia")

    def test_create_session_invalid_category(self):
        with self.assertRaises(ValueError):
            self.engine.create_session(category="Inexistente")

    def test_answer_question_correct(self):
        session = self.engine.create_session(shuffle=False)
        res = session.answer_question(question_id=101, selected_index=0)
        self.assertTrue(res["is_correct"])
        self.assertEqual(res["correct_index"], 0)

    def test_answer_question_incorrect(self):
        session = self.engine.create_session(shuffle=False)
        res = session.answer_question(question_id=101, selected_index=2)
        self.assertFalse(res["is_correct"])

    def test_answer_question_invalid_id_or_option(self):
        session = self.engine.create_session(shuffle=False)
        with self.assertRaises(ValueError):
            session.answer_question(question_id=999, selected_index=0)

        with self.assertRaises(ValueError):
            session.answer_question(question_id=101, selected_index=10)

    def test_session_results_calculation(self):
        session = self.engine.create_session(shuffle=False)
        session.answer_question(101, 0) # Correct
        session.answer_question(102, 0) # Incorrect (correct index is 1)

        results = session.get_results()
        self.assertEqual(results["total_questions"], 2)
        self.assertEqual(results["correct_answers"], 1)
        self.assertEqual(results["score_percentage"], 50.0)


if __name__ == "__main__":
    unittest.main()
