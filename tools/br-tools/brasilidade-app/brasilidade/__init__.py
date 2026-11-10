"""
Brasilidade - Encyclopedia and Quiz of Brazilian Culture, History, and Trivia.
"""

__version__ = "0.1.0"

from .data import ENCYCLOPEDIA_DATA, QUIZ_QUESTIONS
from .quiz import QuizEngine, QuizQuestion, QuizSession

__all__ = [
    "ENCYCLOPEDIA_DATA",
    "QUIZ_QUESTIONS",
    "QuizEngine",
    "QuizQuestion",
    "QuizSession",
]
