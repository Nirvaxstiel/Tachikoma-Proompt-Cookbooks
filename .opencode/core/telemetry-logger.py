"""
Telemetry Logger for Tachikoma
Tracks skill performance, edit success rates, and RLM efficiency

Purpose: Data-driven optimization to improve reliability by +10-15%
Based on: Observability best practices and metrics-driven development

Usage:
    from .opencode.core.telemetry-logger import get_telemetry

    telemetry = get_telemetry()
    telemetry.log_skill_invocation('code-agent', 5000, 2500, True)
    telemetry.log_edit_attempt('glm-4.7', 'hashline', True)
"""

import json
import os
import threading
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Union


class TelemetryLogger:
    """Main telemetry logger for Tachikoma system"""

    def __init__(self, config_path: str = ".opencode/telemetry/metrics-config.yaml"):
        """Initialize telemetry logger with configuration"""
        self.config = self._load_config(config_path)
        self.storage = self.config.get("storage", ".opencode/telemetry/metrics.json")
        self.lock = threading.Lock()
        self._ensure_storage_dir()
        self._metrics_cache = None  # In-memory cache

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load telemetry configuration"""
        try:
            import yaml

            with open(config_path, "r") as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            # Default configuration if file not found
            return {
                "enabled": True,
                "storage": ".opencode/telemetry/metrics.json",
                "retention_days": 30,
                "privacy": {
                    "anonymize_content": True,
                    "store_user_queries": False,
                    "store_code_snippets": False,
                },
            }
        except ImportError:
            # If pyyaml not available, use simple defaults
            return {
                "enabled": True,
                "storage": ".opencode/telemetry/metrics.json",
                "retention_days": 30,
            }

    def _ensure_storage_dir(self):
        """Ensure storage directory exists"""
        storage_dir = os.path.dirname(self.storage)
        if storage_dir:
            os.makedirs(storage_dir, exist_ok=True)

    def _load_metrics(self) -> Dict[str, Any]:
        """Load metrics from storage"""
        if self._metrics_cache is not None:
            return self._metrics_cache

        try:
            with open(self.storage, "r") as f:
                self._metrics_cache = json.load(f)
                return self._metrics_cache
        except FileNotFoundError:
            # Initialize empty metrics structure
            metrics = {
                "skills": {},
                "edits": {},
                "rlm": {},
                "intents": {},
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
            }
            self._metrics_cache = metrics
            return metrics
        except json.JSONDecodeError:
            # If file is corrupted, start fresh
            return self._get_empty_metrics()

    def _get_empty_metrics(self) -> Dict[str, Any]:
        """Return empty metrics structure"""
        return {
            "skills": {},
            "edits": {},
            "rlm": {},
            "intents": {},
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
        }

    def _save_metrics(self, metrics: Dict[str, Any]):
        """Save metrics to storage"""
        metrics["last_updated"] = datetime.now().isoformat()
        self._metrics_cache = metrics

        try:
            with open(self.storage, "w") as f:
                json.dump(metrics, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to save telemetry metrics: {e}")

    def is_enabled(self) -> bool:
        """Check if telemetry is enabled"""
        return self.config.get("enabled", True)

    # ============================================
    # SKILL INVOCATION METRICS
    # ============================================

    def log_skill_invocation(
        self,
        skill_name: str,
        tokens: int,
        duration_ms: int,
        success: bool,
        iterations: int = 1,
        additional_data: Optional[Dict[str, Any]] = None,
    ):
        """
        Log skill execution for metrics tracking

        Args:
            skill_name: Name of the skill (e.g., 'code-agent')
            tokens: Number of tokens used
            duration_ms: Execution duration in milliseconds
            success: Whether the task succeeded
            iterations: Number of iterations (for retry loops)
            additional_data: Additional key-value data to store
        """
        if not self.is_enabled():
            return

        with self.lock:
            metrics = self._load_metrics()

            if skill_name not in metrics["skills"]:
                metrics["skills"][skill_name] = {
                    "invocations": 0,
                    "total_tokens": 0,
                    "total_duration_ms": 0,
                    "success_count": 0,
                    "total_iterations": 0,
                    "last_used": None,
                    "history": [],  # Recent invocations for analysis
                }

            skill = metrics["skills"][skill_name]
            skill["invocations"] += 1
            skill["total_tokens"] += tokens
            skill["total_duration_ms"] += duration_ms
            skill["last_used"] = datetime.now().isoformat()
            skill["total_iterations"] += iterations

            if success:
                skill["success_count"] += 1

            # Add to history (keep last 100)
            skill["history"].append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "tokens": tokens,
                    "duration_ms": duration_ms,
                    "success": success,
                    "iterations": iterations,
                }
            )
            if len(skill["history"]) > 100:
                skill["history"] = skill["history"][-100:]

            # Add additional data if provided
            if additional_data:
                if "additional_data" not in skill:
                    skill["additional_data"] = {}
                for key, value in additional_data.items():
                    if key not in skill["additional_data"]:
                        skill["additional_data"][key] = []
                    skill["additional_data"][key].append(
                        {"timestamp": datetime.now().isoformat(), "value": value}
                    )
                    # Limit additional data entries
                    if len(skill["additional_data"][key]) > 50:
                        skill["additional_data"][key] = skill["additional_data"][key][
                            -50:
                        ]

            self._save_metrics(metrics)

    def get_skill_stats(self, skill_name: str) -> Dict[str, Any]:
        """
        Get statistics for a specific skill

        Returns:
            Dictionary with statistics including:
            - invocations: Total number of invocations
            - avg_tokens: Average tokens per invocation
            - avg_duration_ms: Average duration in milliseconds
            - success_rate: Success rate (0.0 to 1.0)
            - avg_iterations: Average number of iterations
            - last_used: Timestamp of last use
            - p50/p90/p95_duration_ms: Duration percentiles
        """
        metrics = self._load_metrics()
        skill = metrics["skills"].get(skill_name, {})

        if not skill:
            return {}

        invocations = skill.get("invocations", 0)
        success_count = skill.get("success_count", 0)
        total_iterations = skill.get("total_iterations", 0)

        # Calculate duration percentiles
        history = skill.get("history", [])
        durations = [h["duration_ms"] for h in history]
        percentiles = self._calculate_percentiles(durations)

        return {
            "invocations": invocations,
            "avg_tokens": skill.get("total_tokens", 0) / max(invocations, 1),
            "avg_duration_ms": skill.get("total_duration_ms", 0) / max(invocations, 1),
            "success_rate": success_count / max(invocations, 1),
            "avg_iterations": total_iterations / max(invocations, 1),
            "last_used": skill.get("last_used"),
            **percentiles,
        }

    # ============================================
    # EDIT FORMAT METRICS
    # ============================================

    def log_edit_attempt(
        self,
        model: str,
        format_type: str,
        success: bool,
        attempts: int = 1,
        tokens_used: int = 0,
        duration_ms: int = 0,
    ):
        """
        Track which edit formats work for each model

        Args:
            model: Model type (e.g., 'glm-4.7', 'claude-opus-4')
            format_type: Edit format (e.g., 'hashline', 'str_replace', 'apply_patch')
            success: Whether the edit succeeded
            attempts: Number of attempts made
            tokens_used: Tokens used for the edit
            duration_ms: Duration in milliseconds
        """
        if not self.is_enabled():
            return

        with self.lock:
            metrics = self._load_metrics()

            if "edits" not in metrics:
                metrics["edits"] = {}

            if model not in metrics["edits"]:
                metrics["edits"][model] = {
                    "format_success": {},
                    "format_usage": {},
                    "total_attempts": 0,
                    "total_success": 0,
                }

            model_data = metrics["edits"][model]

            # Initialize format data if needed
            if format_type not in model_data["format_success"]:
                model_data["format_success"][format_type] = {
                    "attempts": 0,
                    "successes": 0,
                    "total_tokens": 0,
                    "total_duration_ms": 0,
                }

            if format_type not in model_data["format_usage"]:
                model_data["format_usage"][format_type] = 0

            # Update metrics
            format = model_data["format_success"][format_type]
            format["attempts"] += attempts
            format["successes"] += 1 if success else 0
            format["total_tokens"] += tokens_used
            format["total_duration_ms"] += duration_ms

            model_data["format_usage"][format_type] += 1
            model_data["total_attempts"] += attempts
            model_data["total_success"] += 1 if success else 0

            self._save_metrics(metrics)

    def get_edit_success_rate(self, model: str) -> Dict[str, float]:
        """
        Calculate success rates for edit formats by model

        Returns:
            Dictionary mapping format_type -> success_rate (0.0 to 1.0)
        """
        metrics = self._load_metrics()
        model_data = metrics.get("edits", {}).get(model, {})

        success_rates = {}
        for format_type, data in model_data.get("format_success", {}).items():
            attempts = data.get("attempts", 0)
            successes = data.get("successes", 0)
            success_rates[format_type] = successes / max(attempts, 1)

        return success_rates

    def get_best_format_for_model(self, model: str) -> Optional[str]:
        """
        Get the best-performing format for a model

        Returns:
            Format type with highest success rate, or None if no data
        """
        success_rates = self.get_edit_success_rate(model)
        if not success_rates:
            return None

        # Return format with highest success rate
        return max(success_rates, key=lambda k: success_rates.get(k, 0.0))

    # ============================================
    # RLM METRICS
    # ============================================

    def log_rlm_performance(
        self,
        chunk_count: int,
        processing_time_ms: int,
        parallel: bool,
        chunk_size: int,
        tokens_processed: int = 0,
        accuracy: float = 0.0,
    ):
        """
        Track RLM processing performance

        Args:
            chunk_count: Number of chunks processed
            processing_time_ms: Total processing time in milliseconds
            parallel: Whether parallel processing was used
            chunk_size: Average chunk size
            tokens_processed: Total tokens processed
            accuracy: Accuracy of the result (0.0 to 1.0)
        """
        if not self.is_enabled():
            return

        with self.lock:
            metrics = self._load_metrics()

            if "rlm" not in metrics:
                metrics["rlm"] = {
                    "total_chunks": 0,
                    "chunk_sizes": [],
                    "processing_times": [],
                    "parallel_runs": 0,
                    "sequential_runs": 0,
                    "total_tokens": 0,
                    "accuracy_scores": [],
                }

            rlm = metrics["rlm"]
            rlm["total_chunks"] += chunk_count
            rlm["chunk_sizes"].append(chunk_size)
            rlm["processing_times"].append(processing_time_ms)
            rlm["total_tokens"] += tokens_processed
            rlm["accuracy_scores"].append(accuracy)

            if parallel:
                rlm["parallel_runs"] += 1
            else:
                rlm["sequential_runs"] += 1

            # Keep limited history
            max_history = 1000
            if len(rlm["chunk_sizes"]) > max_history:
                rlm["chunk_sizes"] = rlm["chunk_sizes"][-max_history:]
            if len(rlm["processing_times"]) > max_history:
                rlm["processing_times"] = rlm["processing_times"][-max_history:]
            if len(rlm["accuracy_scores"]) > max_history:
                rlm["accuracy_scores"] = rlm["accuracy_scores"][-max_history:]

            self._save_metrics(metrics)

    def get_rlm_stats(self) -> Dict[str, Any]:
        """
        Get RLM statistics

        Returns:
            Dictionary with RLM performance metrics
        """
        metrics = self._load_metrics()
        rlm = metrics.get("rlm", {})

        chunk_sizes = rlm.get("chunk_sizes", [])
        processing_times = rlm.get("processing_times", [])
        accuracy_scores = rlm.get("accuracy_scores", [])

        seq_runs = rlm.get("sequential_runs", 0)
        return {
            "total_chunks": rlm.get("total_chunks", 0),
            "parallel_runs": rlm.get("parallel_runs", 0),
            "sequential_runs": seq_runs,
            "parallel_vs_sequential_ratio": rlm.get("parallel_runs", 0)
            / max(seq_runs, 1),
            "avg_chunk_size": sum(chunk_sizes) / max(len(chunk_sizes), 1)
            if chunk_sizes
            else 0,
            "avg_processing_time_ms": sum(processing_times)
            / max(len(processing_times), 1)
            if processing_times
            else 0,
            "avg_accuracy": sum(accuracy_scores) / max(len(accuracy_scores), 1)
            if accuracy_scores
            else 0.0,
            "total_tokens": rlm.get("total_tokens", 0),
        }

    # ============================================
    # INTENT METRICS
    # ============================================

    def log_intent_classification(
        self,
        intent: str,
        confidence: float,
        correct: Optional[bool] = None,
        escalated: bool = False,
    ):
        """
        Log intent classification

        Args:
            intent: Classified intent (e.g., 'debug', 'implement')
            confidence: Confidence score (0.0 to 1.0)
            correct: Whether classification was correct (optional)
            escalated: Whether task was escalated to human
        """
        if not self.is_enabled():
            return

        with self.lock:
            metrics = self._load_metrics()

            if "intents" not in metrics:
                metrics["intents"] = {}

            if intent not in metrics["intents"]:
                metrics["intents"][intent] = {
                    "count": 0,
                    "total_confidence": 0.0,
                    "correct_count": 0,
                    "escalation_count": 0,
                }

            intent_data = metrics["intents"][intent]
            intent_data["count"] += 1
            intent_data["total_confidence"] += confidence

            if correct is not None:
                if correct:
                    intent_data["correct_count"] += 1

            if escalated:
                intent_data["escalation_count"] += 1

            self._save_metrics(metrics)

    def get_intent_stats(self, intent: str) -> Dict[str, Any]:
        """
        Get statistics for an intent

        Returns:
            Dictionary with intent statistics
        """
        metrics = self._load_metrics()
        intent_data = metrics.get("intents", {}).get(intent, {})

        count = intent_data.get("count", 0)

        return {
            "count": count,
            "avg_confidence": intent_data.get("total_confidence", 0.0) / max(count, 1),
            "classification_accuracy": intent_data.get("correct_count", 0)
            / max(count, 1)
            if count > 0
            else 0.0,
            "escalation_rate": intent_data.get("escalation_count", 0) / max(count, 1),
        }

    # ============================================
    # UTILITY METHODS
    # ============================================

    def _calculate_percentiles(self, values: List[float]) -> Dict[str, float]:
        """Calculate percentiles for a list of values"""
        if not values:
            return {"p50_duration_ms": 0, "p90_duration_ms": 0, "p95_duration_ms": 0}

        sorted_values = sorted(values)
        n = len(sorted_values)

        def get_percentile(p: float) -> float:
            """Get value at percentile p (0-100)"""
            index = int(p * n / 100)
            return sorted_values[min(index, n - 1)]

        return {
            "p50_duration_ms": get_percentile(50),
            "p90_duration_ms": get_percentile(90),
            "p95_duration_ms": get_percentile(95),
        }

    def export_metrics(self, filepath: str):
        """
        Export metrics to a file

        Args:
            filepath: Path to export file
        """
        metrics = self._load_metrics()

        with open(filepath, "w") as f:
            json.dump(metrics, f, indent=2)

    def clear_old_metrics(self, days: Optional[int] = None):
        """
        Clear old metrics based on retention policy

        Args:
            days: Number of days to retain (defaults to config value)
        """
        if days is None:
            days = self.config.get("retention_days", 30)

        # Ensure days is an integer
        days_int = int(days) if days is not None else 30
        cutoff_date = datetime.now() - timedelta(days=days_int)

        with self.lock:
            metrics = self._load_metrics()

            # Clear old skill history
            for skill_name, skill_data in metrics.get("skills", {}).items():
                if "history" in skill_data:
                    skill_data["history"] = [
                        h
                        for h in skill_data["history"]
                        if datetime.fromisoformat(h["timestamp"]) > cutoff_date
                    ]

            self._save_metrics(metrics)

    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all metrics

        Returns:
            Dictionary with overall statistics
        """
        metrics = self._load_metrics()

        return {
            "created_at": metrics.get("created_at"),
            "last_updated": metrics.get("last_updated"),
            "total_skills": len(metrics.get("skills", {})),
            "total_models": len(metrics.get("edits", {})),
            "total_intents": len(metrics.get("intents", {})),
            "total_invocations": sum(
                s.get("invocations", 0) for s in metrics.get("skills", {}).values()
            ),
            "total_edits": sum(
                m.get("total_attempts", 0) for m in metrics.get("edits", {}).values()
            ),
            "overall_success_rate": self._calculate_overall_success_rate(metrics),
            "rlm_stats": self.get_rlm_stats(),
        }

    def _calculate_overall_success_rate(self, metrics: Dict[str, Any]) -> float:
        """Calculate overall success rate across all skills"""
        total_invocations = 0
        total_successes = 0

        for skill_data in metrics.get("skills", {}).values():
            invocations = skill_data.get("invocations", 0)
            successes = skill_data.get("success_count", 0)
            total_invocations += invocations
            total_successes += successes

        return total_successes / max(total_invocations, 1)


# Singleton instance
_telemetry_instance = None
_instance_lock = threading.Lock()


def get_telemetry(
    config_path: str = ".opencode/telemetry/metrics-config.yaml",
) -> TelemetryLogger:
    """
    Get singleton telemetry instance

    Args:
        config_path: Path to telemetry configuration file

    Returns:
        TelemetryLogger instance
    """
    global _telemetry_instance

    if _telemetry_instance is None:
        with _instance_lock:
            if _telemetry_instance is None:  # Double-check
                _telemetry_instance = TelemetryLogger(config_path)

    return _telemetry_instance


# CLI interface for testing
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Telemetry Logger CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Get telemetry statistics")
    stats_parser.add_argument("--skill", help="Get stats for specific skill")
    stats_parser.add_argument("--model", help="Get edit stats for specific model")
    stats_parser.add_argument("--intent", help="Get intent stats")
    stats_parser.add_argument("--rlm", action="store_true", help="Get RLM stats")
    stats_parser.add_argument(
        "--summary", action="store_true", help="Get overall summary"
    )

    # Export command
    export_parser = subparsers.add_parser("export", help="Export metrics")
    export_parser.add_argument("filepath", help="Path to export file")

    # Clear command
    clear_parser = subparsers.add_parser("clear", help="Clear old metrics")
    clear_parser.add_argument("--days", type=int, default=30, help="Days to retain")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        exit(1)

    telemetry = get_telemetry()

    if args.command == "stats":
        if args.summary:
            summary = telemetry.get_summary()
            print(json.dumps(summary, indent=2))
        elif args.skill:
            stats = telemetry.get_skill_stats(args.skill)
            print(json.dumps(stats, indent=2))
        elif args.model:
            stats = telemetry.get_edit_success_rate(args.model)
            print(json.dumps(stats, indent=2))
        elif args.intent:
            stats = telemetry.get_intent_stats(args.intent)
            print(json.dumps(stats, indent=2))
        elif args.rlm:
            stats = telemetry.get_rlm_stats()
            print(json.dumps(stats, indent=2))
        else:
            print("Specify --skill, --model, --intent, --rlm, or --summary")

    elif args.command == "export":
        telemetry.export_metrics(args.filepath)
        print(f"Exported metrics to {args.filepath}")

    elif args.command == "clear":
        telemetry.clear_old_metrics(args.days)
        print(f"Cleared metrics older than {args.days} days")
