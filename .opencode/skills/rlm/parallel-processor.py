"""
Parallel Wave Processor for RLM
Based on: MIT Recursive Language Models paper (arXiv:2512.24601)

Purpose: 3-4x speedup for large context processing

Key Innovation:
- Process chunks in parallel waves (5 chunks at once)
- Sequential waves, parallel chunks
- Early termination on high-confidence answers

Impact:
- 3-4x faster than sequential processing
- Enables processing 2 orders of magnitude beyond context windows
- Outperforms base models by 28.3% average
"""

import asyncio
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional


class ParallelWaveProcessor:
    """Process RLM chunks in parallel waves"""

    def __init__(
        self,
        max_concurrent: int = 5,
        min_confidence_for_completion: float = 0.8,
        min_high_confidence_chunks: int = 3,
    ):
        """
        Initialize parallel wave processor

        Args:
            max_concurrent: Number of chunks to process in parallel per wave
            min_confidence_for_completion: Minimum confidence to consider a chunk "answered"
            min_high_confidence_chunks: Minimum number of high-confidence chunks to stop early
        """
        self.max_concurrent = max_concurrent
        self.min_confidence = min_confidence_for_completion
        self.min_high_confidence_chunks = min_high_confidence_chunks
        self._executor = None  # Lazy initialization

    def extract_chunk_id(self, chunk_path: str) -> str:
        """
        Extract chunk ID from file path

        Args:
            chunk_path: Path to chunk file

        Returns:
            Chunk ID (filename without extension)
        """
        return os.path.basename(chunk_path).replace(".txt", "").replace(".json", "")

    def process_chunk(
        self,
        chunk_path: str,
        query: str,
        subagent_callback: Callable[[Dict[str, Any]], Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Process single chunk with rlm-subcall subagent

        Args:
            chunk_path: Path to chunk file
            query: User query to answer
            subagent_callback: Callback function that processes the chunk

        Returns:
            Dictionary with processing result
        """
        try:
            # Read chunk content
            with open(chunk_path, "r", encoding="utf-8") as f:
                chunk_content = f.read()

            # Call subagent with chunk
            # Limit content size for token efficiency
            max_content_length = 5000
            truncated_content = chunk_content[:max_content_length]

            result = subagent_callback(
                {
                    "chunk_file": chunk_path,
                    "chunk_content": truncated_content,
                    "query": query,
                    "chunk_size": len(chunk_content),
                }
            )

            return {
                "chunk_id": self.extract_chunk_id(chunk_path),
                "success": True,
                "result": result,
                "timestamp": datetime.now().isoformat(),
                "tokens_processed": len(
                    truncated_content.split()
                ),  # Word count approximation
            }
        except Exception as e:
            return {
                "chunk_id": self.extract_chunk_id(chunk_path),
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "tokens_processed": 0,
            }

    async def process_chunk_async(
        self,
        chunk_path: str,
        query: str,
        subagent_callback: Callable[[Dict[str, Any]], Any],
    ) -> Dict[str, Any]:
        """
        Async version of process_chunk

        Args:
            chunk_path: Path to chunk file
            query: User query
            subagent_callback: Async callback function

        Returns:
            Dictionary with processing result
        """
        try:
            with open(chunk_path, "r", encoding="utf-8") as f:
                chunk_content = f.read()

            max_content_length = 5000
            truncated_content = chunk_content[:max_content_length]

            result = await subagent_callback(
                {
                    "chunk_file": chunk_path,
                    "chunk_content": truncated_content,
                    "query": query,
                    "chunk_size": len(chunk_content),
                }
            )

            return {
                "chunk_id": self.extract_chunk_id(chunk_path),
                "success": True,
                "result": result,
                "timestamp": datetime.now().isoformat(),
                "tokens_processed": len(
                    truncated_content.split()
                ),  # Word count approximation
            }
        except Exception as e:
            return {
                "chunk_id": self.extract_chunk_id(chunk_path),
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "tokens_processed": 0,
            }

    async def process_wave_async(
        self,
        chunk_paths: List[str],
        query: str,
        subagent_callback: Callable[[Dict[str, Any]], Any],
    ) -> List[Dict[str, Any]]:
        """
        Process wave of chunks in parallel (async version)

        Args:
            chunk_paths: List of chunk file paths
            query: User query
            subagent_callback: Async callback function

        Returns:
            List of processing results
        """
        # Limit to max_concurrent chunks
        wave_chunk_paths = chunk_paths[: self.max_concurrent]

        # Create tasks for parallel processing
        tasks = [
            self.process_chunk_async(path, query, subagent_callback)
            for path in wave_chunk_paths
        ]

        # Wait for all to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                processed_results.append(
                    {
                        "chunk_id": "unknown",
                        "success": False,
                        "error": str(result),
                        "timestamp": datetime.now().isoformat(),
                        "tokens_processed": 0,
                    }
                )
            else:
                processed_results.append(result)

        return processed_results

    def process_wave(
        self,
        chunk_paths: List[str],
        query: str,
        subagent_callback: Callable[[Dict[str, Any]], Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Process wave of chunks in parallel (sync version)

        Args:
            chunk_paths: List of chunk file paths
            query: User query
            subagent_callback: Callback function (should be callable)

        Returns:
            List of processing results
        """
        # Limit to max_concurrent chunks
        wave_chunk_paths = chunk_paths[: self.max_concurrent]

        # Process chunks in parallel using ThreadPoolExecutor with context manager
        # This ensures proper cleanup of threads after each wave
        results = []

        with ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
            # Submit all tasks
            future_to_chunk = {
                executor.submit(
                    self.process_chunk, path, query, subagent_callback
                ): path
                for path in wave_chunk_paths
            }

            # Collect results as they complete
            for future in as_completed(future_to_chunk):
                chunk_path = future_to_chunk[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    results.append(
                        {
                            "chunk_id": self.extract_chunk_id(chunk_path),
                            "success": False,
                            "error": str(e),
                            "timestamp": datetime.now().isoformat(),
                            "tokens_processed": 0,
                        }
                    )

        return results

    def _has_confident_answer(self, results: List[Dict[str, Any]]) -> bool:
        """
        Check if answer is complete (confidence-based)

        Args:
            results: List of processing results

        Returns:
            True if enough high-confidence results found
        """
        if not results:
            return False

        # Check for high-confidence results
        high_confidence = [
            r
            for r in results
            if r["success"] and self._extract_confidence(r) > self.min_confidence
        ]

        # Require minimum number of high-confidence chunks
        return len(high_confidence) >= self.min_high_confidence_chunks

    def _extract_confidence(self, result: Dict[str, Any]) -> float:
        """
        Extract confidence score from result

        Args:
            result: Processing result dictionary

        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Try different confidence field names
        confidence = result.get("result", {}).get("confidence", 0.0)

        if isinstance(confidence, (int, float)):
            return float(confidence)

        # Try nested structures
        if isinstance(result.get("result"), dict):
            for key in ["confidence", "certainty", "score", "probability"]:
                if key in result["result"]:
                    val = result["result"][key]
                    if isinstance(val, (int, float)):
                        return float(val)

        return 0.0

    async def process_all_chunks_async(
        self,
        all_chunk_paths: List[str],
        query: str,
        subagent_callback: Callable[[Dict[str, Any]], Any],
    ) -> Dict[str, Any]:
        """
        Process all chunks in waves until answer found (async version)

        Args:
            all_chunk_paths: List of all chunk file paths
            query: User query
            subagent_callback: Async callback function

        Returns:
            Dictionary with processing summary and all results
        """
        all_results = []
        waves = []
        processed_waves = 0

        # Split into waves of max_concurrent chunks
        for i in range(0, len(all_chunk_paths), self.max_concurrent):
            wave = all_chunk_paths[i : i + self.max_concurrent]
            waves.append(wave)

        # Process waves sequentially, chunks in parallel
        for wave_idx, wave in enumerate(waves, 1):
            wave_results = await self.process_wave_async(wave, query, subagent_callback)
            all_results.extend(wave_results)
            processed_waves = wave_idx

            # Early stop if high-confidence answer found
            if self._has_confident_answer(wave_results):
                break

        # Calculate statistics
        successful_results = [r for r in all_results if r["success"]]
        total_tokens = sum(r.get("tokens_processed", 0) for r in all_results)

        return {
            "total_waves": len(waves),
            "processed_waves": processed_waves,
            "total_chunks": len(all_chunk_paths),
            "processed_chunks": len(all_results),
            "successful_chunks": len(successful_results),
            "results": all_results,
            "tokens_processed": total_tokens,
            "early_termination": processed_waves < len(waves),
            "confidence_threshold": self.min_confidence,
        }

    def process_all_chunks(
        self,
        all_chunk_paths: List[str],
        query: str,
        subagent_callback: Callable[[Dict[str, Any]], Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Process all chunks in waves until answer found (sync version)

        Args:
            all_chunk_paths: List of all chunk file paths
            query: User query
            subagent_callback: Callback function

        Returns:
            Dictionary with processing summary and all results
        """
        all_results = []
        waves = []
        processed_waves = 0

        # Split into waves of max_concurrent chunks
        for i in range(0, len(all_chunk_paths), self.max_concurrent):
            wave = all_chunk_paths[i : i + self.max_concurrent]
            waves.append(wave)

        # Process waves sequentially, chunks in parallel
        for wave_idx, wave in enumerate(waves, 1):
            wave_results = self.process_wave(wave, query, subagent_callback)
            all_results.extend(wave_results)
            processed_waves = wave_idx

            # Early stop if high-confidence answer found
            if self._has_confident_answer(wave_results):
                break

        # Calculate statistics
        successful_results = [r for r in all_results if r["success"]]
        total_tokens = sum(r.get("tokens_processed", 0) for r in all_results)

        return {
            "total_waves": len(waves),
            "processed_waves": processed_waves,
            "total_chunks": len(all_chunk_paths),
            "processed_chunks": len(all_results),
            "successful_chunks": len(successful_results),
            "results": all_results,
            "tokens_processed": total_tokens,
            "early_termination": processed_waves < len(waves),
            "confidence_threshold": self.min_confidence,
        }

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get processor statistics

        Returns:
            Dictionary with processor configuration and stats
        """
        return {
            "max_concurrent": self.max_concurrent,
            "min_confidence_for_completion": self.min_confidence,
            "min_high_confidence_chunks": self.min_high_confidence_chunks,
            "active_workers": self.max_concurrent,
        }


# Singleton instance
_processor_instance = None
_instance_lock = threading.Lock()


def get_parallel_processor(
    max_concurrent: int = 5, min_confidence: float = 0.8
) -> ParallelWaveProcessor:
    """
    Get singleton parallel processor instance

    Args:
        max_concurrent: Number of chunks to process in parallel
        min_confidence: Minimum confidence for early termination

    Returns:
        ParallelWaveProcessor instance
    """
    global _processor_instance

    if _processor_instance is None:
        with _instance_lock:
            if _processor_instance is None:  # Double-check locking
                _processor_instance = ParallelWaveProcessor(
                    max_concurrent=max_concurrent,
                    min_confidence_for_completion=min_confidence,
                )

    return _processor_instance


# CLI interface for testing
if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Parallel Wave Processor for RLM")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Test command
    test_parser = subparsers.add_parser("test", help="Test parallel processing")

    test_parser.add_argument(
        "--chunks", type=int, default=10, help="Number of chunks to simulate"
    )
    test_parser.add_argument(
        "--max-concurrent", type=int, default=5, help="Maximum concurrent chunks"
    )

    args = parser.parse_args()

    if args.command == "test":
        print("Testing Parallel Wave Processor...")

        # Create test chunks
        test_dir = ".opencode/rlm_state/test_chunks"
        os.makedirs(test_dir, exist_ok=True)

        for i in range(args.chunks):
            chunk_path = os.path.join(test_dir, f"chunk_{i:03d}.txt")
            with open(chunk_path, "w") as f:
                f.write(f"Test chunk content {i}\n" * 100)

        # Get all chunk paths
        chunk_paths = sorted(
            [
                os.path.join(test_dir, f)
                for f in os.listdir(test_dir)
                if f.endswith(".txt")
            ]
        )

        processor = ParallelWaveProcessor(max_concurrent=args.max_concurrent)

        # Mock callback
        def mock_callback(data):
            return {
                "confidence": 0.9 if "5" in data["chunk_id"] else 0.6,
                "answer": f"Answer from {data['chunk_id']}",
            }

        # Process chunks
        import time

        start = time.time()
        results = processor.process_all_chunks(chunk_paths, "test query", mock_callback)
        duration = time.time() - start

        print(
            f"\nProcessed {results['processed_chunks']} chunks in {results['processed_waves']} waves"
        )
        print(f"Time: {duration:.2f}s")
        print(f"Early termination: {results['early_termination']}")
        print(
            f"Successful chunks: {results['successful_chunks']}/{results['processed_chunks']}"
        )

        # Cleanup
        import shutil

        shutil.rmtree(test_dir)

    else:
        parser.print_help()
