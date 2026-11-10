"""
Quiz Engine logic for handling quiz sessions, filtering questions, scoring, and response evaluation.
"""

import random
from typing import List, Dict, Any, Optional


class QuizQuestion:
    def __init__(
        self,
        question_id: int,
        category: str,
        question: str,
        options: List[str],
        correct_index: int,
        explanation: str
    ):
        self.id = question_id
        self.category = category
        self.question = question
        self.options = options
        self.correct_index = correct_index
        self.explanation = explanation

    def to_dict(self, include_answer: bool = True) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "category": self.category,
            "question": self.question,
            "options": self.options,
        }
        if include_answer:
            data["correct_index"] = self.correct_index
            data["explanation"] = self.explanation
        return data


class QuizSession:
    def __init__(self, questions: List[QuizQuestion]):
        self.questions = questions
        self.user_answers: Dict[int, int] = {}

    def answer_question(self, question_id: int, selected_index: int) -> Dict[str, Any]:
        question = next((q for q in self.questions if q.id == question_id), None)
        if not question:
            raise ValueError(f"Question with id {question_id} not found.")

        if not (0 <= selected_index < len(question.options)):
            raise ValueError(f"Invalid option index {selected_index}.")

        self.user_answers[question_id] = selected_index
        is_correct = (selected_index == question.correct_index)

        return {
            "question_id": question_id,
            "selected_index": selected_index,
            "correct_index": question.correct_index,
            "is_correct": is_correct,
            "explanation": question.explanation
        }

    def get_results(self) -> Dict[str, Any]:
        total = len(self.questions)
        correct_count = 0
        details = []

        for q in self.questions:
            selected = self.user_answers.get(q.id)
            is_correct = (selected == q.correct_index) if selected is not None else False
            if is_correct:
                correct_count += 1
            details.append({
                "id": q.id,
                "category": q.category,
                "question": q.question,
                "selected_index": selected,
                "correct_index": q.correct_index,
                "is_correct": is_correct,
                "explanation": q.explanation
            })

        score_percentage = round((correct_count / total * 100), 1) if total > 0 else 0.0

        return {
            "total_questions": total,
            "correct_answers": correct_count,
            "score_percentage": score_percentage,
            "details": details
        }


class QuizEngine:
    def __init__(self, raw_questions: Optional[List[Dict[str, Any]]] = None):
        if raw_questions is None:
            from .data import QUIZ_QUESTIONS
            raw_questions = QUIZ_QUESTIONS

        self.questions: List[QuizQuestion] = [
            QuizQuestion(
                question_id=item["id"],
                category=item["category"],
                question=item["question"],
                options=list(item["options"]),
                correct_index=item["correct_index"],
                explanation=item["explanation"]
            )
            for item in raw_questions
        ]

    def get_categories(self) -> List[str]:
        categories = sorted(list({q.category for q in self.questions}))
        return categories

    def create_session(
        self,
        category: Optional[str] = None,
        limit: Optional[int] = None,
        shuffle: bool = True
    ) -> QuizSession:
        filtered = self.questions
        if category:
            filtered = [q for q in filtered if q.category.lower() == category.lower()]

        if not filtered:
            raise ValueError(f"No questions found for category: '{category}'")

        selected = list(filtered)
        if shuffle:
            random.shuffle(selected)

        if limit and limit > 0:
            selected = selected[:limit]

        return QuizSession(selected)
