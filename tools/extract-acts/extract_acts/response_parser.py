"""Parser and validator for LLM extraction responses."""

import json
import re
from typing import Any, Dict, Optional

from extract_acts.schema import ExtractionResult, ValidationError, validate_extraction_dict


class ParseError(ValueError):
    """Raised when the LLM output cannot be parsed into valid JSON or schema."""
    pass


def extract_json_payload(raw_text: str) -> str:
    """Extracts raw JSON substring from a text that might contain markdown fences or surrounding chatter."""
    if not raw_text or not raw_text.strip():
        raise ParseError("Response text is empty")

    text = raw_text.strip()

    # Match ```json ... ``` or ``` ... ```
    fence_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(fence_pattern, text, re.IGNORECASE)
    if match:
        text = match.group(1).strip()

    # If still not starting with '{' or '[', find outer braces
    if not text.startswith("{") and not text.startswith("["):
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            text = text[first_brace : last_brace + 1]

    return text


class ResponseParser:
    def __init__(self, allow_partial: bool = False):
        self.allow_partial = allow_partial

    def parse(self, raw_response: str) -> ExtractionResult:
        """Parses a raw LLM response string into an ExtractionResult dataclass."""
        cleaned_json_str = extract_json_payload(raw_response)

        try:
            parsed_data = json.loads(cleaned_json_str)
        except json.JSONDecodeError as e:
            raise ParseError(f"Failed to decode JSON from model response: {e}") from e

        # In case the model returned a bare list of action items instead of a dict
        if isinstance(parsed_data, list):
            parsed_data = {"action_items": parsed_data}

        try:
            return validate_extraction_dict(parsed_data)
        except ValidationError as e:
            if self.allow_partial and isinstance(parsed_data, dict):
                # Attempt best-effort fallback
                return self._salvage_partial(parsed_data, str(e))
            raise ParseError(f"Schema validation failed: {e}") from e

    def _salvage_partial(self, data: Dict[str, Any], validation_error_msg: str) -> ExtractionResult:
        from extract_acts.schema import ActionItem, Priority, Status, validate_action_item_dict

        title = data.get("meeting_title") if isinstance(data.get("meeting_title"), str) else None
        summary = data.get("summary") if isinstance(data.get("summary"), str) else None
        raw_items = data.get("action_items")

        valid_items = []
        if isinstance(raw_items, list):
            for item in raw_items:
                try:
                    valid_items.append(validate_action_item_dict(item))
                except ValidationError:
                    continue

        return ExtractionResult(
            meeting_title=title,
            summary=summary,
            action_items=valid_items,
        )
