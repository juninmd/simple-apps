"""Prompt builder for extracting action items from transcripts."""

from typing import Any, Dict, List, Optional

SYSTEM_PROMPT = """You are an expert executive assistant specializing in extracting clear, checkable action items from meeting transcripts.

Your task is to analyze the provided transcript and extract all commitments, tasks, assignments, and follow-ups.

Output Format Guidelines:
- Respond strictly with valid JSON. Do not include markdown code block markers unless required.
- The JSON object must strictly conform to this schema:
  {
    "meeting_title": "string or null",
    "summary": "string or null",
    "action_items": [
      {
        "description": "string (imperative, clear task statement)",
        "assignee": "string or null",
        "due_date": "string or null",
        "priority": "low" | "medium" | "high" | "critical",
        "status": "todo" | "in_progress" | "done",
        "context": "string or null"
      }
    ]
  }

Extraction Guidelines:
1. Description: Start with a strong action verb (e.g., 'Schedule', 'Prepare', 'Investigate').
2. Assignee: Identify who committed to or was assigned the task. If unclear, use null.
3. Due date: Extract explicit or implicit deadlines (e.g. 'by Friday', '2026-11-15'). If not mentioned, use null.
4. Priority: Infer priority from urgency words or explicit mentions. Default to 'medium'.
5. Status: Default to 'todo' unless transcript indicates work has started or is already done.
6. Context: Include brief relevant quotes or rationale if helpful."""


class PromptBuilder:
    def __init__(
        self,
        system_prompt: str = SYSTEM_PROMPT,
        include_context: bool = True,
        default_priority: str = "medium",
    ):
        self.system_prompt = system_prompt
        self.include_context = include_context
        self.default_priority = default_priority

    def build_user_prompt(
        self,
        transcript: str,
        additional_instructions: Optional[str] = None,
        participants: Optional[List[str]] = None,
    ) -> str:
        """Constructs the user prompt given the meeting transcript and optional metadata."""
        if not transcript or not transcript.strip():
            raise ValueError("Transcript cannot be empty")

        sections = []

        if participants:
            cleaned_participants = [p.strip() for p in participants if p and p.strip()]
            if cleaned_participants:
                sections.append(f"Meeting Participants: {', '.join(cleaned_participants)}")

        if additional_instructions and additional_instructions.strip():
            sections.append(f"Additional Instructions:\n{additional_instructions.strip()}")

        sections.append("Meeting Transcript:")
        sections.append(transcript.strip())
        sections.append(
            "Extract the action items following the schema instructions. Provide JSON only."
        )

        return "\n\n".join(sections)

    def build_messages(
        self,
        transcript: str,
        additional_instructions: Optional[str] = None,
        participants: Optional[List[str]] = None,
    ) -> List[Dict[str, str]]:
        """Constructs standard chat messages array (system + user)."""
        user_prompt = self.build_user_prompt(
            transcript=transcript,
            additional_instructions=additional_instructions,
            participants=participants,
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt},
        ]
