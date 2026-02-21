#!/usr/bin/env python3
"""
Hash generation utilities for Tachikoma tools.

This module provides centralized hash generation functions with
configurable length and algorithm support to reduce code duplication.
"""

import hashlib
import time
from typing import Literal


def generate_hash(
    content: str,
    length: int = 16,
    algorithm: Literal["md5", "sha256"] = "md5",
    include_timestamp: bool = False,
) -> str:
    """
    Generate hash with configurable length.

    Args:
        content: Content to hash
        length: Number of characters to return
        algorithm: Hash algorithm ("md5" or "sha256")
        include_timestamp: Add timestamp to content before hashing

    Returns:
        Hash string truncated to specified length

    Examples:
        >>> generate_hash("hello", length=8)
        '185f8db3'
        >>> generate_hash("hello", algorithm="sha256", length=12)
        '2cf24dba5fb0'
        >>> generate_hash("hello", include_timestamp=True, length=4)
        'a1b2'  # (will vary based on timestamp)
    """
    if include_timestamp:
        content = f"{content}{time.time()}"

    if algorithm == "md5":
        hash_obj = hashlib.md5(content.encode())
    elif algorithm == "sha256":
        hash_obj = hashlib.sha256(content.encode())
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    return hash_obj.hexdigest()[:length]


def generate_hashline(content: str, length: int = 2) -> str:
    """
    Generate short hash for hashline annotations.

    This is specifically designed for model-aware-editor hashline generation,
    which needs very short hashes (2-4 characters) for line-level annotations.

    Args:
        content: Content to hash
        length: Number of characters (typically 2-4 for hashlines)

    Returns:
        Short hash string for hashline annotation
    """
    return generate_hash(content, length=length, algorithm="md5")


def generate_node_id(content: str) -> str:
    """
    Generate node ID for memory store.

    Uses 16-character MD5 hash for memory store node identification.

    Args:
        content: Content to hash

    Returns:
        16-character hash string
    """
    return generate_hash(content, length=16, algorithm="md5")


def generate_ref_id(content: str) -> str:
    """
    Generate reference ID for observation store.

    Uses 8-character MD5 hash for compact reference IDs.

    Args:
        content: Content to hash

    Returns:
        8-character hash string
    """
    return generate_hash(content, length=8, algorithm="md5")
