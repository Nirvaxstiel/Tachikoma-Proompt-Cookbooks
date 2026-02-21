#!/usr/bin/env python3
"""
Structured Summarization Utilities

Provides classes for probe-based evaluation and anchored iterative summarization.
Pattern from: Can Bölük's "The Harness Problem" research.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class ProbeType(Enum):
    RECALL = "recall"
    ARTIFACT = "artifact"
    CONTINUATION = "continuation"
    DECISION = "decision"


class Probe:
    """A probe question for evaluating compression quality."""

    probe_type: ProbeType
    question: str
    ground_truth: Optional[str] = None
    context_reference: Optional[str] = None


class CriterionResult:
    """Result for a single evaluation criterion."""

    criterion_id: str
    score: float
    reasoning: str


class EvaluationResult:
    """Complete evaluation result for a probe response."""

    probe: Probe
    response: str
    criterion_results: List[CriterionResult]
    aggregate_score: float
    dimension_scores: Dict[str, float] = field(default_factory=dict)


class StructuredSummarizer:
    """Generate structured summaries with explicit sections.

    Pattern from: Can Bölük's "The Harness Problem" research.
    """

    TEMPLATE = """## Session Intent
{intent}

## Files Modified
{files_modified}

## Files Read (Not Modified)
{files_read}

## Decisions Made
{decisions}

## Current State
{current_state}

## Next Steps
{next_steps}
"""

    def __init__(self):
        self.sections = {
            "intent": "",
            "files_modified": [],
            "files_read": [],
            "decisions": [],
            "current_state": "",
            "next_steps": [],
        }

    def update_from_span(self, new_content: str) -> str:
        """
        Update summary from newly truncated content span.

        Implements anchored iterative summarization:
        - Extract information from new span
        - Merge with existing sections
        - Return updated summary
        """
        new_info = self._extract_from_content(new_content)

        # Merge with existing sections
        self._merge_sections(new_info)

        # Generate formatted summary
        return self._format_summary()

    def _extract_from_content(self, content: str) -> Dict:
        """Extract structured information from content."""
        extracted = {
            "intent": "",
            "files_modified": [],
            "files_read": [],
            "decisions": [],
            "current_state": "",
            "next_steps": [],
        }

        # Extract file modifications
        mod_pattern = r"(?:modified|changed|updated|fixed)\s+([^\s]+\.[:\s]*)(?:\n|$)"
        for match in re.finditer(mod_pattern, content, re.IGNORECASE):
            extracted["files_modified"].append(
                {"path": match.group(1), "change": match.group(2).strip()[:100]}
            )

        # Extract file reads
        read_pattern = r"(?:read|examined|opened|checked)\s+([^\s]+\.[:\s]*)(?:\n|$)"
        for match in re.finditer(read_pattern, content, re.IGNORECASE):
            file_path = match.group(1)
            if file_path not in [f["path"] for f in extracted["files_modified"]]:
                extracted["files_read"].append(file_path)

        # Extract decisions
        decision_pattern = r"(?:decided|chose|going with|will use)\s+(.+?)(?:\n|$)"
        for match in re.finditer(decision_pattern, content, re.IGNORECASE):
            extracted["decisions"].append(match.group(1).strip()[:150])

        return extracted

    def _merge_sections(self, new_info: Dict):
        """Merge new information with existing sections."""
        # Update intent if empty
        if new_info["intent"] and not self.sections["intent"]:
            self.sections["intent"] = new_info["intent"]

        # Merge file lists (deduplicate by path)
        existing_mod_paths = [f["path"] for f in self.sections["files_modified"]]
        for file_info in new_info["files_modified"]:
            if file_info["path"] not in existing_mod_paths:
                self.sections["files_modified"].append(file_info)

        # Merge read files
        for file_path in new_info["files_read"]:
            if file_path not in [f["path"] for f in self.sections["files_read"]]:
                self.sections["files_read"].append(file_path)

        # Append decisions
        self.sections["decisions"].extend(new_info["decisions"])

        # Update current state (latest wins)
        if new_info["current_state"]:
            self.sections["current_state"] = new_info["current_state"]

        # Merge next steps
        self.sections["next_steps"].extend(new_info["next_steps"])

    def _format_summary(self) -> str:
        """Format sections into summary string."""
        files_modified_str = (
            "\n".join(
                f"- {f['path']}: {f['change']}" for f in self.sections["files_modified"]
            )
            or "None"
        )

        files_read_str = (
            "\n".join(f"- {f}" for f in self.sections["files_read"]) or "None"
        )

        decisions_str = (
            "\n".join(f"- {d}" for d in self.sections["decisions"][-5:]) or "None"
        )

        next_steps_str = (
            "\n".join(
                f"{i + 1}. {s}" for i, s in enumerate(self.sections["next_steps"][-5:])
            )
            or "None"
        )

        return self.TEMPLATE.format(
            intent=self.sections["intent"] or "Not specified",
            files_modified=files_modified_str,
            files_read=files_read_str,
            decisions=decisions_str,
            current_state=self.sections["current_state"] or "In progress",
            next_steps=next_steps_str,
        )
