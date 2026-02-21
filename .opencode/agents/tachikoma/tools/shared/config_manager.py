#!/usr/bin/env python3
"""
Unified Configuration Management for Tachikoma tools.

This module provides consistent YAML configuration loading across all Tachikoma scripts,
eliminating duplication and ensuring proper error handling.

Features:
- Consistent YAML loading with UTF-8 encoding
- Automatic default fallback
- Optional caching for frequently accessed configs
- Error handling and logging
"""

import yaml
from pathlib import Path
from typing import Any, Callable, Dict, Optional
from functools import lru_cache


class ConfigManager:
    """
    Unified configuration management for Tachikoma tools.

    Provides consistent YAML configuration loading with automatic
    error handling and default fallback values.
    """

    @staticmethod
    def load_yaml(path: str | Path, default: Dict = None) -> Dict:
        """
        Load YAML configuration file with automatic error handling.

        Args:
            path: Path to YAML file
            default: Default configuration if file doesn't exist or fails to load

        Returns:
            Loaded configuration dict or default value
        """
        try:
            with open(path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except (FileNotFoundError, yaml.YAMLError, IOError) as e:
            if default is not None:
                return default
            raise

    @staticmethod
    def load_yaml_or_default(path: str | Path, default: Dict) -> Dict:
        """
        Load YAML configuration with default fallback.

        Convenience method that always returns a dict, never raises.

        Args:
            path: Path to YAML file
            default: Default configuration if file doesn't exist

        Returns:
            Loaded configuration dict or default value
        """
        return ConfigManager.load_yaml(path, default) or {}

    @classmethod
    @lru_cache(maxsize=32)
    def load_yaml_cached(cls, path: str | Path, default: Dict = None) -> Dict:
        """
        Load YAML configuration with LRU caching.

        Useful for frequently accessed configuration files.
        Cache is limited to 32 most recently accessed configs.

        Args:
            path: Path to YAML file
            default: Default configuration if file doesn't exist

        Returns:
            Loaded configuration dict or default value (cached)
        """
        return ConfigManager.load_yaml(path, default)

    @staticmethod
    def get(config: Dict, *keys: str, default: Any = None) -> Any:
        """
        Safely get nested values from configuration dict.

        Args:
            config: Configuration dictionary
            *keys: Keys to traverse (e.g., get(config, 'a', 'b', 'c'))
            default: Default value if path doesn't exist

        Returns:
            Value at nested path or default

        Examples:
            >>> config = {'routes': {'debug': {'skill': 'code-agent'}}}
            >>> ConfigManager.get(config, 'routes', 'debug', 'skill')
            'code-agent'
        """
        current = config
        for key in keys:
            if not isinstance(current, dict):
                return default
            if key not in current:
                return default
            current = current[key]
        return current

    @staticmethod
    def save_yaml(path: str | Path, config: Dict) -> bool:
        """
        Save configuration to YAML file.

        Args:
            path: Path to save YAML file
            config: Configuration dictionary to save

        Returns:
            True if successful, False otherwise
        """
        try:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                yaml.safe_dump(config, f, default_flow_style=False, sort_keys=False)
            return True
        except (IOError, OSError, yaml.YAMLError) as e:
            print(f"Error saving config to {path}: {e}")
            return False

    @staticmethod
    def merge(*configs: Dict) -> Dict:
        """
        Merge multiple configuration dictionaries.

        Later configs override earlier ones.

        Args:
            *configs: Configuration dictionaries to merge

        Returns:
            Merged configuration dictionary

        Example:
            >>> default = {'debug': True}
            >>> override = {'debug': False, 'feature': 'new'}
            >>> ConfigManager.merge(default, override)
            {'debug': False, 'feature': 'new'}
        """
        result = {}
        for config in configs:
            result = {**result, **config}
        return result


__all__ = ["ConfigManager"]
