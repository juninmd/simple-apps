"""Tests for iCal/ICS feed generation."""

import datetime
import unittest
from br_feriado_checker.holidays import Holiday
from br_feriado_checker.ical import generate_ics

class TestICalGeneration(unittest.TestCase):

    def test_generate_ics_format(self):
        holidays = [
            Holiday(datetime.date(2026, 1, 1), "Confraternização Universal", "Nacional", "Ano Novo"),
            Holiday(datetime.date(2026, 12, 25), "Natal", "Nacional", "Natal"),
        ]

        ics = generate_ics(holidays, calendar_name="Feriados Teste")

        self.assertTrue(ics.startswith("BEGIN:VCALENDAR"))
        self.assertTrue(ics.endswith("END:VCALENDAR\r\n"))
        self.assertIn("VERSION:2.0", ics)
        self.assertIn("X-WR-CALNAME:Feriados Teste", ics)
        self.assertIn("BEGIN:VEVENT", ics)
        self.assertIn("SUMMARY:Confraternização Universal", ics)
        self.assertIn("DTSTART;VALUE=DATE:20260101", ics)
        self.assertIn("DTEND;VALUE=DATE:20260102", ics)
        self.assertIn("SUMMARY:Natal", ics)
        self.assertIn("DTSTART;VALUE=DATE:20261225", ics)
        self.assertIn("DTEND;VALUE=DATE:20261226", ics)

    def test_text_values_are_escaped(self):
        holidays = [
            Holiday(datetime.date(2026, 6, 1), "Feriado, teste; a\\b", "Municipal", "linha1\nlinha2"),
        ]

        ics = generate_ics(holidays, calendar_name="Calendário, teste;")

        self.assertIn("X-WR-CALNAME:Calendário\\, teste\\;", ics)
        self.assertIn("SUMMARY:Feriado\\, teste\\; a\\\\b", ics)
        self.assertIn("DESCRIPTION:Tipo: Municipal. linha1\\nlinha2", ics)

    def test_empty_holidays(self):
        ics = generate_ics([])
        self.assertIn("BEGIN:VCALENDAR", ics)
        self.assertNotIn("BEGIN:VEVENT", ics)
        self.assertIn("END:VCALENDAR", ics)


if __name__ == "__main__":
    unittest.main()
