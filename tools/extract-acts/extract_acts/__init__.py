"""Extract Acts - Turn meeting transcripts into checkable task lists."""

from extract_acts.pipeline import ExtractionPipeline
from extract_acts.prompt_builder import PromptBuilder
from extract_acts.response_parser import ParseError, ResponseParser
from extract_acts.schema import ActionItem, ExtractionResult, Priority, Status, ValidationError
from extract_acts.theme import detect_terminal_theme, get_theme_for_mode

__version__ = "0.1.0"
__all__ = [
    "ActionItem",
    "ExtractionPipeline",
    "ExtractionResult",
    "ParseError",
    "Priority",
    "PromptBuilder",
    "ResponseParser",
    "Status",
    "ValidationError",
    "__version__",
    "detect_terminal_theme",
    "get_theme_for_mode",
]
