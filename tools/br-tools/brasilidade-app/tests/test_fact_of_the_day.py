import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
import sys

# Ensure src is in python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from fact_of_the_day import load_facts, get_daily_fact, format_fact_markdown


class TestFactOfTheDay(unittest.TestCase):

    def setUp(self):
        self.sample_facts = [
            {"id": "fact1", "topic": "Topic 1", "title": "Title 1", "fact": "Fact content 1"},
            {"id": "fact2", "topic": "Topic 2", "title": "Title 2", "fact": "Fact content 2"},
            {"id": "fact3", "topic": "Topic 3", "title": "Title 3", "fact": "Fact content 3"},
        ]

    def test_load_facts(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as tmp:
            json.dump(self.sample_facts, tmp)
            tmp_path = Path(tmp.name)

        try:
            facts = load_facts(tmp_path)
            self.assertEqual(len(facts), 3)
            self.assertEqual(facts[0]["id"], "fact1")
        finally:
            tmp_path.unlink()

    def test_load_empty_facts_raises_error(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as tmp:
            json.dump([], tmp)
            tmp_path = Path(tmp.name)

        try:
            with self.assertRaises(ValueError):
                load_facts(tmp_path)
        finally:
            tmp_path.unlink()

    def test_get_daily_fact_deterministic(self):
        test_date = date(2026, 9, 28)
        fact1 = get_daily_fact(self.sample_facts, target_date=test_date)
        fact2 = get_daily_fact(self.sample_facts, target_date=test_date)
        self.assertEqual(fact1, fact2)

        # Check consecutive dates select sequentially / cyclically
        expected_index_day1 = test_date.toordinal() % len(self.sample_facts)
        self.assertEqual(fact1, self.sample_facts[expected_index_day1])

        next_date = date(2026, 9, 29)
        expected_index_day2 = next_date.toordinal() % len(self.sample_facts)
        fact_next_day = get_daily_fact(self.sample_facts, target_date=next_date)
        self.assertEqual(fact_next_day, self.sample_facts[expected_index_day2])

    def test_format_fact_markdown(self):
        fact = self.sample_facts[0]
        md = format_fact_markdown(fact, date_str="2026-09-28")
        self.assertIn("### 🇧🇷 Fact of the Day - 2026-09-28", md)
        self.assertIn("**Title 1**", md)
        self.assertIn("*Topic 1*", md)
        self.assertIn("Fact content 1", md)


if __name__ == "__main__":
    unittest.main()
