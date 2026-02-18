"""
Parallel Wave Processor for RLM
Based on: MIT Recursive Language Models paper (arXiv:2512.24601)

Purpose: 3-4x speedup for large context processing
"""

import asyncio
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Callable, Dict, List

# Constants
MAX_CONTENT_LENGTH = 5000

# Singleton
_processor_instance = None
_instance_lock = threading.Lock()


def get_parallel_processor(max_concurrent: int = 5, min_confidence: float = 0.8):
    """Get singleton processor instance"""
    global _processor_instance
    if _processor_instance is None:
        with _instance_lock:
            if _processor_instance is None:
                _processor_instance = ParallelWaveProcessor(
                    max_concurrent=max_concurrent,
                    min_confidence=min_confidence,
                )
    return _processor_instance


class ParallelWaveProcessor:
    """Process RLM chunks in parallel waves"""

    def __init__(
        self,
        max_concurrent: int = 5,
        min_confidence: float = 0.8,
        min_high_confidence_chunks: int = 3,
    ):
        self.max_concurrent = max_concurrent
        self.min_confidence = min_confidence
        self.min_high_confidence_chunks = min_high_confidence_chunks

    # -------------------------------------------------------------------------
    # Core processing (single implementation for sync/async)
    # -------------------------------------------------------------------------

    async def process_chunk(
        self,
        chunk_path: str,
        query: str,
        callback: Callable,
    ) -> Dict[str, Any]:
        """Process single chunk - works with sync or async callbacks"""
        chunk_id = os.path.basename(chunk_path).replace(".txt", "").replace(".json", "")

        try:
            with open(chunk_path, encoding="utf-8") as f:
                content = f.read()[:MAX_CONTENT_LENGTH]

            # Handle both sync and async callbacks
            if asyncio.iscoroutinefunction(callback):
                result = await callback(
                    {
                        "chunk_file": chunk_path,
                        "chunk_content": content,
                        "query": query,
                        "chunk_size": len(content),
                    }
                )
            else:
                result = callback(
                    {
                        "chunk_file": chunk_path,
                        "chunk_content": content,
                        "query": query,
                        "chunk_size": len(content),
                    }
                )

            return {
                "chunk_id": chunk_id,
                "success": True,
                "result": result,
                "timestamp": datetime.now().isoformat(),
                "tokens_processed": len(content.split()),
            }
        except Exception as e:
            return {
                "chunk_id": chunk_id,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "tokens_processed": 0,
            }

    # -------------------------------------------------------------------------
    # Wave processing (async with sync wrapper)
    # -------------------------------------------------------------------------

    async def process_wave(
        self,
        chunk_paths: List[str],
        query: str,
        callback: Callable,
    ) -> List[Dict[str, Any]]:
        """Process wave of chunks in parallel"""
        paths = chunk_paths[: self.max_concurrent]

        if asyncio.iscoroutinefunction(callback):
            tasks = [self.process_chunk(p, query, callback) for p in paths]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            # Sync path - use thread pool
            with ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
                futures = {
                    executor.submit(self._sync_wrapper, p, query, callback): p
                    for p in paths
                }
                results = [f.result() for f in as_completed(futures)]

        # Normalize exceptions
        normalized = []
        for r in results:
            if isinstance(r, Exception):
                normalized.append(
                    {
                        "chunk_id": "unknown",
                        "success": False,
                        "error": str(r),
                        "timestamp": datetime.now().isoformat(),
                        "tokens_processed": 0,
                    }
                )
            else:
                normalized.append(r)
        return normalized

    def _sync_wrapper(
        self, chunk_path: str, query: str, callback: Callable
    ) -> Dict[str, Any]:
        """Sync wrapper to run async process_chunk"""
        return asyncio.run(self.process_chunk(chunk_path, query, callback))

    # -------------------------------------------------------------------------
    # Main entry point
    # -------------------------------------------------------------------------

    async def process_all(
        self,
        chunk_paths: List[str],
        query: str,
        callback: Callable,
    ) -> Dict[str, Any]:
        """Process all chunks in waves with early termination"""
        waves = [
            chunk_paths[i : i + self.max_concurrent]
            for i in range(0, len(chunk_paths), self.max_concurrent)
        ]

        all_results = []
        wave_idx = 0
        for wave_idx, wave in enumerate(waves, 1):
            wave_results = await self.process_wave(wave, query, callback)
            all_results.extend(wave_results)

            if self._has_confident_answer(wave_results):
                break

        return {
            "total_waves": len(waves),
            "processed_waves": wave_idx,
            "total_chunks": len(chunk_paths),
            "processed_chunks": len(all_results),
            "successful_chunks": sum(1 for r in all_results if r["success"]),
            "results": all_results,
            "tokens_processed": sum(r.get("tokens_processed", 0) for r in all_results),
            "early_termination": wave_idx < len(waves),
            "confidence_threshold": self.min_confidence,
        }

    def process_all_chunks(
        self, chunk_paths: List[str], query: str, callback: Callable
    ) -> Dict[str, Any]:
        """Sync entry point"""
        return asyncio.run(self.process_all(chunk_paths, query, callback))

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    def _has_confident_answer(self, results: List[Dict]) -> bool:
        if not results:
            return False
        high_conf = [
            r
            for r in results
            if r.get("success") and self._extract_confidence(r) >= self.min_confidence
        ]
        return len(high_conf) >= self.min_high_confidence_chunks

    def _extract_confidence(self, result: Dict) -> float:
        conf = result.get("result", {}).get("confidence", 0.0)
        if isinstance(conf, (int, float)):
            return float(conf)
        if isinstance(result.get("result"), dict):
            for key in ["confidence", "certainty", "score", "probability"]:
                if key in result["result"] and isinstance(
                    result["result"][key], (int, float)
                ):
                    return float(result["result"][key])
        return 0.0

    def get_statistics(self) -> Dict[str, Any]:
        return {
            "max_concurrent": self.max_concurrent,
            "min_confidence": self.min_confidence,
            "min_high_confidence_chunks": self.min_high_confidence_chunks,
        }


# CLI
if __name__ == "__main__":
    import argparse
    import shutil
    import time

    parser = argparse.ArgumentParser(description="Parallel Wave Processor")
    subparsers = parser.add_subparsers(dest="command")

    test_parser = subparsers.add_parser("test")
    test_parser.add_argument("--chunks", type=int, default=10)
    test_parser.add_argument("--max-concurrent", type=int, default=5)

    args = parser.parse_args()

    if args.command == "test":
        test_dir = ".opencode/rlm_state/test_chunks"
        os.makedirs(test_dir, exist_ok=True)

        for i in range(args.chunks):
            with open(os.path.join(test_dir, f"chunk_{i:03d}.txt"), "w") as f:
                f.write(f"Test chunk {i}\n" * 100)

        chunk_paths = sorted(
            [
                os.path.join(test_dir, f)
                for f in os.listdir(test_dir)
                if f.endswith(".txt")
            ]
        )

        def mock_callback(data):
            return {
                "confidence": 0.9 if "5" in data["chunk_id"] else 0.6,
                "answer": f"Answer from {data['chunk_id']}",
            }

        processor = ParallelWaveProcessor(max_concurrent=args.max_concurrent)
        start = time.time()
        results = processor.process_all_chunks(chunk_paths, "test query", mock_callback)

        print(
            f"Processed {results['processed_chunks']} chunks in {results['processed_waves']} waves"
        )
        print(f"Time: {time.time() - start:.2f}s")
        print(f"Early termination: {results['early_termination']}")

        shutil.rmtree(test_dir)
