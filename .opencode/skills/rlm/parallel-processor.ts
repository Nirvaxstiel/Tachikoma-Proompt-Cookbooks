#!/usr/bin/env bun
/**
 * Parallel Wave Processor for RLM
 * Based on: MIT Recursive Language Models paper (arXiv:2512.24601)
 * 
 * Purpose: 3-4x speedup for large context processing
 * 
 * Converted from: parallel_processor.py
 */

import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { colors, printHeader } from '../../cli/lib/colors';

const MAX_CONTENT_LENGTH = 5000;

interface ChunkResult {
  chunk_id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp: string;
  tokens_processed: number;
}

interface ProcessResult {
  total_waves: number;
  processed_waves: number;
  total_chunks: number;
  processed_chunks: number;
  successful_chunks: number;
  results: ChunkResult[];
  tokens_processed: number;
  early_termination: boolean;
  confidence_threshold: number;
}

interface ProcessStats {
  max_concurrent: number;
  min_confidence: number;
  min_high_confidence_chunks: number;
}

type CallbackFunction = (data: {
  chunk_file: string;
  chunk_content: string;
  query: string;
  chunk_size: number;
}) => unknown | Promise<unknown>;

class ParallelWaveProcessor {
  private maxConcurrent: number;
  private minConfidence: number;
  private minHighConfidenceChunks: number;

  constructor(
    maxConcurrent = 5,
    minConfidence = 0.8,
    minHighConfidenceChunks = 3
  ) {
    this.maxConcurrent = maxConcurrent;
    this.minConfidence = minConfidence;
    this.minHighConfidenceChunks = minHighConfidenceChunks;
  }

  async processChunk(
    chunkPath: string,
    query: string,
    callback: CallbackFunction
  ): Promise<ChunkResult> {
    const chunkId = basename(chunkPath).replace(/\.txt$/, '').replace(/\.json$/, '');

    try {
      const content = existsSync(chunkPath)
        ? readFileSync(chunkPath, 'utf-8').slice(0, MAX_CONTENT_LENGTH)
        : '';

      const result = await callback({
        chunk_file: chunkPath,
        chunk_content: content,
        query,
        chunk_size: content.length,
      });

      return {
        chunk_id: chunkId,
        success: true,
        result,
        timestamp: new Date().toISOString(),
        tokens_processed: content.split(/\s+/).length,
      };
    } catch (e) {
      return {
        chunk_id: chunkId,
        success: false,
        error: String(e),
        timestamp: new Date().toISOString(),
        tokens_processed: 0,
      };
    }
  }

  async processWave(
    chunkPaths: string[],
    query: string,
    callback: CallbackFunction
  ): Promise<ChunkResult[]> {
    const paths = chunkPaths.slice(0, this.maxConcurrent);
    const promises = paths.map(p => this.processChunk(p, query, callback));
    const results = await Promise.allSettled(promises);

    return results.map(r => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      return {
        chunk_id: 'unknown',
        success: false,
        error: r.reason?.message || String(r.reason),
        timestamp: new Date().toISOString(),
        tokens_processed: 0,
      };
    });
  }

  async processAll(
    chunkPaths: string[],
    query: string,
    callback: CallbackFunction
  ): Promise<ProcessResult> {
    const waves: string[][] = [];
    for (let i = 0; i < chunkPaths.length; i += this.maxConcurrent) {
      waves.push(chunkPaths.slice(i, i + this.maxConcurrent));
    }

    const allResults: ChunkResult[] = [];
    let waveIdx = 0;

    for (waveIdx = 0; waveIdx < waves.length; waveIdx++) {
      const waveResults = await this.processWave(waves[waveIdx], query, callback);
      allResults.push(...waveResults);

      if (this.hasConfidentAnswer(waveResults)) {
        waveIdx++; // Increment before break for accurate count
        break;
      }
    }

    return {
      total_waves: waves.length,
      processed_waves: waveIdx,
      total_chunks: chunkPaths.length,
      processed_chunks: allResults.length,
      successful_chunks: allResults.filter(r => r.success).length,
      results: allResults,
      tokens_processed: allResults.reduce((sum, r) => sum + r.tokens_processed, 0),
      early_termination: waveIdx < waves.length,
      confidence_threshold: this.minConfidence,
    };
  }

  private hasConfidentAnswer(results: ChunkResult[]): boolean {
    if (results.length === 0) return false;

    const highConf = results.filter(r => {
      if (!r.success) return false;
      return this.extractConfidence(r) >= this.minConfidence;
    });

    return highConf.length >= this.minHighConfidenceChunks;
  }

  private extractConfidence(result: ChunkResult): number {
    const res = result.result as Record<string, unknown> | undefined;
    if (!res) return 0;

    const conf = res.confidence;
    if (typeof conf === 'number') return conf;

    for (const key of ['confidence', 'certainty', 'score', 'probability']) {
      const val = res[key];
      if (typeof val === 'number') return val;
    }

    return 0;
  }

  getStatistics(): ProcessStats {
    return {
      max_concurrent: this.maxConcurrent,
      min_confidence: this.minConfidence,
      min_high_confidence_chunks: this.minHighConfidenceChunks,
    };
  }
}

let processorInstance: ParallelWaveProcessor | null = null;

function getParallelProcessor(
  maxConcurrent = 5,
  minConfidence = 0.8
): ParallelWaveProcessor {
  if (!processorInstance) {
    processorInstance = new ParallelWaveProcessor(maxConcurrent, minConfidence);
  }
  return processorInstance;
}

// CLI
function printUsage(): void {
  printHeader('Parallel Wave Processor');
  console.log();
  console.log(`${colors.yellow}Usage:${colors.reset}`);
  console.log(`  bun run parallel-processor.ts <command> [args]`);
  console.log();
  console.log(`${colors.yellow}Commands:${colors.reset}`);
  console.log(`  ${colors.green}test${colors.reset} [options]          Run test with mock chunks`);
  console.log();
  console.log(`${colors.yellow}Test Options:${colors.reset}`);
  console.log(`  --chunks <n>            Number of test chunks (default: 10)`);
  console.log(`  --max-concurrent <n>    Max concurrent processes (default: 5)`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  if (command === 'test') {
    let chunks = 10;
    let maxConcurrent = 5;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--chunks' && args[i + 1]) {
        chunks = parseInt(args[++i], 10);
      } else if (args[i] === '--max-concurrent' && args[i + 1]) {
        maxConcurrent = parseInt(args[++i], 10);
      }
    }

    const testDir = '.opencode/rlm_state/test_chunks';
    mkdirSync(testDir, { recursive: true });

    // Create test chunks
    for (let i = 0; i < chunks; i++) {
      const chunkPath = join(testDir, `chunk_${String(i).padStart(3, '0')}.txt`);
      writeFileSync(chunkPath, `Test chunk ${i}\n`.repeat(100));
    }

    const chunkPaths: string[] = [];
    for (let i = 0; i < chunks; i++) {
      chunkPaths.push(join(testDir, `chunk_${String(i).padStart(3, '0')}.txt`));
    }

    const mockCallback: CallbackFunction = (data) => {
      return {
        confidence: data.chunk_id.includes('5') ? 0.9 : 0.6,
        answer: `Answer from ${data.chunk_id}`,
      };
    };

    const processor = new ParallelWaveProcessor(maxConcurrent);
    const start = Date.now();
    const results = await processor.processAll(chunkPaths, 'test query', mockCallback);

    console.log(`Processed ${results.processed_chunks} chunks in ${results.processed_waves} waves`);
    console.log(`Time: ${((Date.now() - start) / 1000).toFixed(2)}s`);
    console.log(`Early termination: ${results.early_termination}`);

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  } else {
    console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
    printUsage();
    process.exit(1);
  }
}

export { ParallelWaveProcessor, getParallelProcessor };
export type { ChunkResult, ProcessResult, ProcessStats, CallbackFunction };

main().catch(err => {
  console.error(`${colors.red}Error:${colors.reset}`, err.message);
  process.exit(1);
});
