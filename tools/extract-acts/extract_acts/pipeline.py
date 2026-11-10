"""Core extraction pipeline for meeting transcripts."""

from typing import Any, Callable, Dict, List, Optional

from extract_acts.prompt_builder import PromptBuilder
from extract_acts.response_parser import ResponseParser
from extract_acts.schema import ExtractionResult


class ExtractionPipeline:
    def __init__(
        self,
        prompt_builder: Optional[PromptBuilder] = None,
        response_parser: Optional[ResponseParser] = None,
        llm_caller: Optional[Callable[[List[Dict[str, str]]], str]] = None,
    ):
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.response_parser = response_parser or ResponseParser()
        self.llm_caller = llm_caller

    def extract(
        self,
        transcript: str,
        additional_instructions: Optional[str] = None,
        participants: Optional[List[str]] = None,
        llm_caller: Optional[Callable[[List[Dict[str, str]]], str]] = None,
    ) -> ExtractionResult:
        """Extracts action items from a transcript using the configured or passed LLM caller."""
        caller = llm_caller or self.llm_caller
        if caller is None:
            raise ValueError("No LLM caller provided to ExtractionPipeline")

        messages = self.prompt_builder.build_messages(
            transcript=transcript,
            additional_instructions=additional_instructions,
            participants=participants,
        )

        raw_response = caller(messages)
        return self.response_parser.parse(raw_response)
