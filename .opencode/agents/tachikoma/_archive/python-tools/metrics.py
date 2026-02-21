#!/usr/bin/env python3
"""
Unified Metrics calculation utilities for Tachikoma tools.

This module provides consistent metric calculations across all Tachikoma scripts,
eliminating duplication in scoring, ratios, and health calculations.

Features:
- Weighted sum calculations
- Utilization ratios with bounds checking
- Health scores from penalties
- Composite metrics
"""

from typing import Dict, List, Optional


class Metrics:
    """
    Unified metrics calculation utilities for Tachikoma tools.

    Provides consistent calculations for scores, ratios, and health metrics.
    """

    @staticmethod
    def weighted_sum(scores: Dict[str, float], weights: Dict[str, float]) -> float:
        """
        Calculate weighted sum of scores.

        Args:
            scores: Dictionary of score names to values
            weights: Dictionary of score names to weights

        Returns:
            Weighted sum of scores

        Example:
            >>> scores = {'accuracy': 0.9, 'speed': 0.8}
            >>> weights = {'accuracy': 0.7, 'speed': 0.3}
            >>> Metrics.weighted_sum(scores, weights)
            0.87
        """
        total = 0.0
        total_weight = 0.0

        for key, weight in weights.items():
            if key in scores:
                total += scores[key] * weight
                total_weight += weight

        return total / total_weight if total_weight > 0 else 0.0

    @staticmethod
    def utilization(current: int, maximum: int) -> float:
        """
        Calculate utilization ratio with bounds checking.

        Args:
            current: Current value
            maximum: Maximum possible value

        Returns:
            Utilization ratio between 0.0 and 1.0

        Example:
            >>> Metrics.utilization(80, 100)
            0.8
        """
        if maximum <= 0:
            return 0.0
        return max(0.0, min(1.0, current / maximum))

    @staticmethod
    def health_score(*penalties: float) -> float:
        """
        Calculate composite health score from penalties.

        Health score starts at 1.0 and is reduced by penalties.

        Args:
            *penalties: Penalty values to subtract (0.0 to 1.0 each)

        Returns:
            Health score between 0.0 and 1.0

        Example:
            >>> Metrics.health_score(0.2, 0.1, 0.1)
            0.6
        """
        score = 1.0
        for penalty in penalties:
            score = max(0.0, score - penalty)
        return score

    @staticmethod
    def average(values: List[float]) -> float:
        """
        Calculate average of values.

        Args:
            values: List of numeric values

        Returns:
            Average value or 0.0 if empty

        Example:
            >>> Metrics.average([0.8, 0.9, 0.7])
            0.8
        """
        if not values:
            return 0.0
        return sum(values) / len(values)

    @staticmethod
    def percentage(value: int, total: int) -> float:
        """
        Calculate percentage with division by zero protection.

        Args:
            value: Numerator
            total: Denominator

        Returns:
            Percentage (0.0 to 100.0)

        Example:
            >>> Metrics.percentage(25, 100)
            25.0
        """
        if total == 0:
            return 0.0
        return (value / total) * 100.0

    @staticmethod
    def clamp(value: float, minimum: float, maximum: float) -> float:
        """
        Clamp value between minimum and maximum.

        Args:
            value: Value to clamp
            minimum: Minimum allowed value
            maximum: Maximum allowed value

        Returns:
            Clamped value

        Example:
            >>> Metrics.clamp(150, 0, 100)
            100.0
        """
        return max(minimum, min(maximum, value))

    @staticmethod
    def score_level(score: float) -> str:
        """
        Convert numeric score to descriptive level.

        Args:
            score: Numeric score (typically 0.0 to 1.0)

        Returns:
            Descriptive level (excellent, good, acceptable, poor, failed)

        Example:
            >>> Metrics.score_level(0.95)
            'excellent'
            >>> Metrics.score_level(0.6)
            'acceptable'
        """
        if score >= 0.9:
            return "excellent"
        elif score >= 0.8:
            return "good"
        elif score >= 0.6:
            return "acceptable"
        elif score >= 0.3:
            return "poor"
        else:
            return "failed"


__all__ = ["Metrics"]
