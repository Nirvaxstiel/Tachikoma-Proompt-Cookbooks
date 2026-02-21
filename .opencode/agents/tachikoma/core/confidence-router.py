#!/usr/bin/env python3
"""
Confidence-Based Task Router
Routes tasks based on confidence scores
Purpose: +15% reliability through appropriate escalation
"""

from typing import Any, Dict, List, Optional, Tuple

import yaml


class ConfidenceRouter:
    """Route tasks based on confidence scores"""

    # Complexity patterns for difficulty classification
    COMPLEXITY_PATTERNS = {
        "simple": [
            "fix typo",
            "add comment",
            "rename variable",
            "format code",
            "update doc",
            "change text",
        ],
        "medium": [
            "add feature",
            "refactor function",
            "update endpoint",
            "change logic",
            "implement function",
        ],
        "complex": [
            "implement system",
            "migrate codebase",
            "optimize architecture",
            "integrate api",
            "add auth",
        ],
        "critical": [
            "security fix",
            "data migration",
            "payment integration",
            "auth implementation",
            "database migration",
        ],
    }

    def __init__(self, config_path: str = ".opencode/config/confidence-routes.yaml"):
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: str) -> Dict:
        try:
            with open(config_path, "r") as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            return {
                "escalation_rules": {
                    "low_confidence": {"threshold": 0.7},
                    "very_low_confidence": {"threshold": 0.5},
                    "high_confidence": {"threshold": 0.9},
                },
                "task_difficulty_multipliers": {
                    "simple": 1.0,
                    "medium": 1.1,
                    "complex": 1.2,
                    "critical": 1.3,
                },
            }

    def classify_difficulty(self, task: str) -> str:
        """Classify task difficulty"""
        task_lower = task.lower()

        # Check critical first
        for pattern in self.COMPLEXITY_PATTERNS["critical"]:
            if pattern in task_lower:
                return "critical"

        # Check complex
        for pattern in self.COMPLEXITY_PATTERNS["complex"]:
            if pattern in task_lower:
                return "complex"

        # Check simple
        for pattern in self.COMPLEXITY_PATTERNS["simple"]:
            if pattern in task_lower:
                return "simple"

        # Default to medium
        return "medium"

    def get_threshold(self, difficulty: str) -> float:
        """Get confidence threshold for difficulty"""
        multipliers = self.config.get("task_difficulty_multipliers", {})
        thresholds = self.config.get("confidence_thresholds", {})

        base = thresholds.get("default", 0.7)
        multiplier = multipliers.get(difficulty, 1.0)

        # Handle both float and dict formats
        if isinstance(multiplier, dict):
            multiplier = multiplier.get("multiplier", 1.0)

        return base * multiplier

    def route_task(
        self, task: str, confidence: float, intent: str = None
    ) -> Dict[str, Any]:
        """Route task based on confidence"""
        difficulty = self.classify_difficulty(task)
        threshold = self.get_threshold(difficulty)
        escalation = self.config.get("escalation_rules", {})

        if confidence >= threshold:
            return {
                "action": "proceed_direct",
                "route_to": None,
                "difficulty": difficulty,
                "confidence": confidence,
                "threshold": threshold,
                "reason": f"High confidence ({confidence:.2f} >= {threshold:.2f})",
                "verification_needed": False,
            }
        elif confidence >= escalation.get("very_low_confidence", {}).get(
            "threshold", 0.5
        ):
            return {
                "action": "verify",
                "route_to": "verifier-code-agent",
                "difficulty": difficulty,
                "confidence": confidence,
                "threshold": threshold,
                "reason": f"Medium confidence, adding verification",
                "verification_needed": True,
                "verification_skill": "verifier-code-agent",
            }
        else:
            return {
                "action": "ask_user",
                "route_to": None,
                "difficulty": difficulty,
                "confidence": confidence,
                "threshold": threshold,
                "reason": f"Low confidence ({confidence:.2f}), requires human input",
                "verification_needed": False,
                "suggested_questions": [
                    "Does this approach meet your requirements?",
                    "Are there any concerns?",
                ],
            }

    def should_verify(self, task: str, confidence: float, intent: str = None) -> bool:
        """Quick check if verification is needed"""
        route = self.route_task(task, confidence, intent)
        return route.get("verification_needed", False)


def get_confidence_router() -> ConfidenceRouter:
    """Get confidence router instance"""
    return ConfidenceRouter()


# CLI
if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Confidence Router")
    subparsers = parser.add_subparsers(dest="command")

    route_parser = subparsers.add_parser("route", help="Route a task")
    route_parser.add_argument("task", help="Task description")
    route_parser.add_argument(
        "--confidence", type=float, required=True, help="Confidence (0-1)"
    )
    route_parser.add_argument("--intent", help="Intent")

    args = parser.parse_args()

    if args.command == "route":
        router = get_confidence_router()
        result = router.route_task(args.task, args.confidence, args.intent)

        print(f"\n=== ROUTING DECISION ===")
        print(f"Task: {args.task}")
        print(f"Difficulty: {result['difficulty']}")
        print(
            f"Confidence: {result['confidence']:.2f} (threshold: {result['threshold']:.2f})"
        )
        print(f"Action: {result['action']}")
        print(f"Reason: {result['reason']}")
        if result.get("route_to"):
            print(f"Route to: {result['route_to']}")
    else:
        parser.print_help()
