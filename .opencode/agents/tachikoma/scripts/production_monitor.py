#!/usr/bin/env python3
"""
Production Monitoring for Skill Quality

Monitors agent skill performance with sampling, metrics tracking, and alerting.
Pattern from: `.opencode/patterns/production-patterns.md`

Usage:
    python production_monitor.py --sample-rate 0.01
    python production_monitor.py record --query "user question" --output "response" --score 0.8
    python production_monitor.py report
    python production_monitor.py list
"""

import argparse
import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum


class ScoreLevel(Enum):
    """Quality score levels"""
    EXCELLENT = 1.0
    GOOD = 0.8
    ACCEPTABLE = 0.6
    POOR = 0.3
    FAILED = 0.0


class AlertSeverity(Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


@dataclass
class Sample:
    """A production sample record"""
    timestamp: float
    query: str
    output_preview: str
    score: float
    passed: bool
    duration_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Alert:
    """A generated alert"""
    severity: AlertSeverity
    type: str
    message: str
    timestamp: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class ProductionMonitor:
    """Production monitoring system for agent skills"""

    def __init__(
        self,
        sample_rate: float = 0.01,
        data_dir: str = ".opencode/data/production_monitor",
        alert_thresholds: Optional[Dict[str, float]] = None,
    ):
        """
        Initialize production monitor

        Args:
            sample_rate: Fraction of interactions to sample (default 1%)
            data_dir: Directory for storing samples and metrics
            alert_thresholds: Custom alert thresholds
        """
        self.sample_rate = sample_rate
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.alert_thresholds = alert_thresholds or {
            "pass_rate_warning": 0.85,
            "pass_rate_critical": 0.70,
            "score_warning": 0.6,
            "score_critical": 0.4,
        }

        self.samples_file = self.data_dir / "samples.jsonl"
        self.metrics_file = self.data_dir / "metrics.json"

        # Load existing samples
        self._load_samples()

    def _load_samples(self):
        """Load existing samples from disk"""
        if not self.samples_file.exists():
            self.samples: List[Sample] = []
            return

        samples = []
        try:
            with open(self.samples_file, "r", encoding="utf-8") as f:
                for line in f:
                    samples.append(json.loads(line.strip()))
            self.samples = samples
        except Exception:
            self.samples = []

    def should_sample(self) -> bool:
        """Determine if current interaction should be sampled"""
        import random
        return random.random() < self.sample_rate

    def record_sample(
        self,
        query: str,
        output: str,
        score: float,
        passed: bool,
        duration_ms: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Sample:
        """
        Record a production sample

        Args:
            query: User query (truncated to first 200 chars)
            output: Agent output (truncated to first 200 chars)
            score: Quality score (0.0-1.0)
            passed: Whether evaluation passed
            duration_ms: Execution time in milliseconds
            metadata: Additional metadata

        Returns:
            Sample object
        """
        sample = Sample(
            timestamp=time.time(),
            query=query[:200],
            output=output[:200],
            score=score,
            passed=passed,
            duration_ms=duration_ms,
            metadata=metadata or {},
        )

        # Append to in-memory samples
        self.samples.append(sample)

        # Save to disk
        with open(self.samples_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(sample.__dict__) + "\n")

        return sample

    def get_metrics(self, window_hours: int = 24) -> Dict[str, Any]:
        """
        Calculate metrics from samples within a time window

        Args:
            window_hours: Time window in hours (default 24 hours)

        Returns:
            Metrics dictionary with calculated values
        """
        if not self.samples:
            return {"error": "No samples available"}

        # Filter samples within window
        cutoff_time = time.time() - (window_hours * 3600)
        window_samples = [s for s in self.samples if s.timestamp >= cutoff_time]

        if not window_samples:
            return {"error": "No samples in window"}

        # Calculate metrics
        total_samples = len(window_samples)
        passed = sum(1 for s in window_samples if s.passed)
        failed = total_samples - passed
        pass_rate = passed / total_samples if total_samples > 0 else 0.0

        avg_score = sum(s.score for s in window_samples) / total_samples
        avg_duration = sum(s.duration_ms for s in window_samples) / total_samples

        # Determine status
        if pass_rate < self.alert_thresholds["pass_rate_critical"]:
            status = "critical"
        elif pass_rate < self.alert_thresholds["pass_rate_warning"]:
            status = "warning"
        elif avg_score < self.alert_thresholds["score_critical"]:
            status = "warning"  # Low quality but pass rate OK
        else:
            status = "healthy"

        # Generate alerts
        alerts = []
        if status == "critical":
            alerts.append({
                "severity": AlertSeverity.CRITICAL.value,
                "type": "pass_rate",
                "message": f"Pass rate ({pass_rate:.2f}) below critical threshold ({self.alert_thresholds['pass_rate_critical']:.0f})",
                "timestamp": time.time(),
            })
        elif status == "warning":
            if pass_rate < self.alert_thresholds["pass_rate_warning"]:
                alerts.append({
                    "severity": AlertSeverity.WARNING.value,
                    "type": "pass_rate",
                    "message": f"Pass rate ({pass_rate:.2f}) below warning threshold ({self.alert_thresholds['pass_rate_warning']:.0f})",
                    "timestamp": time.time(),
                })

        return {
            "window_hours": window_hours,
            "total_samples": total_samples,
            "passed": passed,
            "failed": failed,
            "pass_rate": pass_rate,
            "average_score": avg_score,
            "average_duration_ms": avg_duration,
            "status": status,
            "alerts": alerts,
            "timestamp": time.time(),
        }

    def list_samples(self, limit: int = 10):
        """List recent samples"""
        recent = sorted(self.samples, key=lambda s: s.timestamp, reverse=True)[:limit]

        for i, sample in enumerate(recent, 1):
            timestamp = datetime.fromtimestamp(sample.timestamp).strftime("%Y-%m-%d %H:%M:%S")
            status_icon = "✓" if sample.passed else "✗"
            score_level = self._get_score_level(sample.score)

            print(f"{i}. [{timestamp}] {status_icon} Score: {sample.score:.2f} ({score_level}) - {sample.query[:50]}")

    def _get_score_level(self, score: float) -> str:
        """Get human-readable score level"""
        if score >= ScoreLevel.EXCELLENT.value:
            return "Excellent"
        elif score >= ScoreLevel.GOOD.value:
            return "Good"
        elif score >= ScoreLevel.ACCEPTABLE.value:
            return "Acceptable"
        elif score >= ScoreLevel.POOR.value:
            return "Poor"
        else:
            return "Failed"

    def generate_report(self) -> str:
        """Generate human-readable report"""
        metrics = self.get_metrics(window_hours=24)

        if "error" in metrics:
            return "No samples available for reporting."

        print("=" * 60)
        print(f"PRODUCTION MONITORING REPORT")
        print(f"Time Window: Last {metrics['window_hours']} hours")
        print(f"Status: {metrics['status'].upper()}")
        print("=" * 60)
        print()
        print(f"Total Samples:     {metrics['total_samples']}")
        print(f"Passed:            {metrics['passed']}")
        print(f"Failed:            {metrics['failed']}")
        print()
        print(f"Pass Rate:        {metrics['pass_rate']:.2%}")
        print(f"Average Score:     {metrics['average_score']:.2f}")
        print(f"Avg Duration:      {metrics['average_duration_ms']:.0f}ms")
        print()

        # Alerts
        if metrics["alerts"]:
            print("⚠️  ALERTS")
            for alert in metrics["alerts"]:
                severity_upper = alert["severity"].upper()
                print(f"  [{severity_upper}] {alert['type']}: {alert['message']}")

        return f"Report generated with {metrics['total_samples']} samples"


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Production Monitoring for Tachikoma Agent Skills"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Record command
    record_parser = subparsers.add_parser("record", help="Record a production sample")
    record_parser.add_argument("--query", required=True, help="User query")
    record_parser.add_argument("--output", required=True, help="Agent output")
    record_parser.add_argument("--score", type=float, required=True, help="Quality score (0.0-1.0)")
    record_parser.add_argument("--passed", type=lambda x: x.lower() == "true", help="Passed (true/false)")
    record_parser.add_argument("--duration", type=float, default=0.0, help="Duration in milliseconds")
    record_parser.add_argument("--metadata", type=json.loads, help="Additional metadata (JSON)")

    # Report command
    report_parser = subparsers.add_parser("report", help="Generate monitoring report")
    report_parser.add_argument("--window", type=int, default=24, help="Time window in hours (default 24)")
    report_parser.add_argument("--json", action="store_true", help="Output JSON format")

    # List command
    list_parser = subparsers.add_parser("list", help="List recent samples")
    list_parser.add_argument("--limit", type=int, default=10, help="Number of samples to show (default 10)")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show monitoring status")
    status_parser.add_argument("--hours", type=int, default=24, help="Time window in hours")

    args = parser.parse_args()

    # Create monitor instance
    monitor = ProductionMonitor()

    # Execute command
    if args.command == "record":
        sample = monitor.record_sample(
            query=args.query,
            output=args.output,
            score=args.score,
            passed=args.passed,
            duration_ms=args.duration,
            metadata=args.metadata,
        )
        print(f"✓ Sample recorded: Score={sample.score:.2f}, Passed={sample.passed}")

    elif args.command == "report":
        if args.json:
            metrics = monitor.get_metrics(window_hours=args.window)
            print(json.dumps(metrics, indent=2))
        else:
            monitor.generate_report()

    elif args.command == "list":
        monitor.list_samples(limit=args.limit)

    elif args.command == "status":
        metrics = monitor.get_metrics(window_hours=args.hours)
        print(json.dumps(metrics, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
