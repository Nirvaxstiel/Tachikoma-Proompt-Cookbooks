#!/usr/bin/env bun
/**
 * Adaptive Chunker for RLM
 * Based on: MIT Recursive Language Models paper (arXiv:2512.24601)
 * 
 * Purpose: 2-5x efficiency over fixed chunk sizes through semantic boundary detection
 * 
 * Converted from: adaptive_chunker.py
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { colors, printHeader } from '../../cli/lib/colors';

enum ContentType {
  JSON = "json",
  MARKDOWN = "markdown",
  LOG = "log",
  CODE = "code",
  TEXT = "text"
}

interface ChunkResult {
  content: string;
  index: number;
}

interface ChunkerStats {
  current_chunk_size: number;
  min_chunk_size: number;
  max_chunk_size: number;
  optimal_time_ms: number;
  adjustments_made: number;
  avg_processing_time_ms: number;
  processing_times: number[];
  size_adjustments: number;
}

const CONTENT_TYPE_PATTERNS = {
  json_obj: /^\{.*\}$/s,
  json_arr: /^\[.*\]$/s,
  markdown: /^#{1,6}\s/,
  log: /^\[\d{4}-\d{2}-\d{2}\]/,
  code: [
    /^(import|def|class|from|function|const|let|var|interface|type)\s+/,
    /^(public|private|protected|async|await)\s+/,
    /^(if|for|while|switch|try|catch|return)\s*\(/,
  ],
};

function getSemanticPatterns(contentType: ContentType): RegExp[] {
  switch (contentType) {
    case ContentType.MARKDOWN:
      return [/^#{2,4}\s+/gm];
    case ContentType.JSON:
      return [/\n(?=\{|\[)/g];
    case ContentType.LOG:
      return [/^\[\d{4}-\d{2}-\d{2}\]/gm];
    case ContentType.CODE:
      return [
        /^(def |class |function |class |interface |type |struct )/gm,
        /^(public |private |protected |static |async )\s+(def |class |function )/gm,
      ];
    case ContentType.TEXT:
      return [/\n\n+/g];
    default:
      return [];
  }
}

class AdaptiveChunker {
  private chunkSize: number;
  private minChunkSize: number;
  private maxChunkSize: number;
  private optimalTime: number;
  private processingTimes: number[] = [];

  constructor(
    initialChunkSize = 50000,
    minChunkSize = 50000,
    maxChunkSize = 200000,
    optimalProcessingTimeMs = 10000
  ) {
    this.chunkSize = initialChunkSize;
    this.minChunkSize = minChunkSize;
    this.maxChunkSize = maxChunkSize;
    this.optimalTime = optimalProcessingTimeMs;
  }

  detectContentType(content: string): ContentType {
    const stripped = content.trim();

    if (CONTENT_TYPE_PATTERNS.json_obj.test(stripped)) return ContentType.JSON;
    if (CONTENT_TYPE_PATTERNS.json_arr.test(stripped)) return ContentType.JSON;
    if (CONTENT_TYPE_PATTERNS.markdown.test(stripped)) return ContentType.MARKDOWN;
    if (CONTENT_TYPE_PATTERNS.log.test(stripped)) return ContentType.LOG;

    for (const pattern of CONTENT_TYPE_PATTERNS.code) {
      if (pattern.test(stripped)) return ContentType.CODE;
    }

    return ContentType.TEXT;
  }

  findSemanticBoundaries(content: string, contentType: ContentType): number[] {
    const boundaries: number[] = [0];
    const patterns = getSemanticPatterns(contentType);

    if (contentType === ContentType.JSON) {
      try {
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          let offset = 0;
          for (let i = 0; i < data.length; i++) {
            const itemStr = JSON.stringify(data[i]);
            const itemPos = content.indexOf(itemStr, offset);
            if (itemPos !== -1 && i > 0) {
              boundaries.push(itemPos);
            }
            offset = itemPos + itemStr.length;
          }
        } else if (typeof data === 'object' && data !== null) {
          let offset = 0;
          const entries = Object.entries(data);
          for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            const kvStr = `"${key}":${JSON.stringify(value)}`;
            const kvPos = content.indexOf(kvStr, offset);
            if (kvPos !== -1 && i > 0) {
              boundaries.push(kvPos);
            }
            offset = kvPos + kvStr.length;
          }
        }
      } catch {
        for (const pattern of patterns) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(content)) !== null) {
            boundaries.push(match.index);
          }
        }
      }
    } else {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(content)) !== null) {
          boundaries.push(match.index);
        }
      }
    }

    boundaries.push(content.length);
    return [...new Set(boundaries)].sort((a, b) => a - b);
  }

  private splitLargeChunk(chunk: string, maxSize: number): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    for (let i = 0; i < chunk.length; i += maxSize) {
      chunks.push({
        content: chunk.slice(i, i + maxSize),
        index: Math.floor(i / maxSize),
      });
    }
    return chunks;
  }

  createAdaptiveChunks(content: string, maxChunks?: number): ChunkResult[] {
    const contentType = this.detectContentType(content);
    const boundaries = this.findSemanticBoundaries(content, contentType);

    const chunks: ChunkResult[] = [];
    let i = 0;

    while (i < boundaries.length - 1) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      const chunk = content.slice(start, end);
      const chunkLen = chunk.length;

      if (chunkLen > this.chunkSize * 2) {
        const subChunks = this.splitLargeChunk(chunk, this.chunkSize);
        chunks.push(...subChunks);
        i++;
      } else if (chunkLen < this.chunkSize * 0.5) {
        if (i < boundaries.length - 2) {
          const merged = chunk + content.slice(end, boundaries[i + 2]);
          chunks.push({ content: merged, index: chunks.length });
          i += 2;
        } else {
          chunks.push({ content: chunk, index: chunks.length });
          i++;
        }
      } else {
        chunks.push({ content: chunk, index: chunks.length });
        i++;
      }
    }

    if (maxChunks && chunks.length > maxChunks) {
      const mergedChunks: ChunkResult[] = [];
      const targetChunkSize = Math.floor(content.length / maxChunks);

      let currentChunk = '';
      let currentSize = 0;

      for (const { content: chunk } of chunks) {
        if (currentSize + chunk.length <= targetChunkSize) {
          currentChunk += chunk;
          currentSize += chunk.length;
        } else {
          if (currentChunk) {
            mergedChunks.push({ content: currentChunk, index: mergedChunks.length });
          }
          currentChunk = chunk;
          currentSize = chunk.length;
        }
      }

      if (currentChunk) {
        mergedChunks.push({ content: currentChunk, index: mergedChunks.length });
      }

      return mergedChunks;
    }

    return chunks;
  }

  adjustChunkSize(processingTimeMs: number): void {
    this.processingTimes.push(processingTimeMs);

    if (processingTimeMs < 5000) {
      this.chunkSize = Math.min(Math.floor(this.chunkSize * 1.2), this.maxChunkSize);
    } else if (processingTimeMs > 15000) {
      this.chunkSize = Math.max(Math.floor(this.chunkSize * 0.7), this.minChunkSize);
    }
  }

  getStats(): ChunkerStats {
    const avgTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      current_chunk_size: this.chunkSize,
      min_chunk_size: this.minChunkSize,
      max_chunk_size: this.maxChunkSize,
      optimal_time_ms: this.optimalTime,
      adjustments_made: this.processingTimes.length,
      avg_processing_time_ms: avgTime,
      processing_times: this.processingTimes,
      size_adjustments: this.processingTimes.filter(t => t < 5000 || t > 15000).length,
    };
  }

  createChunksFile(content: string, outputDir: string, prefix = 'chunk'): string[] {
    mkdirSync(outputDir, { recursive: true });

    const chunks = this.createAdaptiveChunks(content);
    const chunkPaths: string[] = [];

    for (const { content: chunkContent, index } of chunks) {
      const chunkPath = join(outputDir, `${prefix}_${String(index).padStart(3, '0')}.txt`);
      writeFileSync(chunkPath, chunkContent, 'utf-8');
      chunkPaths.push(chunkPath);
    }

    return chunkPaths;
  }

  getContentTypeName(contentType: ContentType): string {
    const names: Record<ContentType, string> = {
      [ContentType.JSON]: 'JSON',
      [ContentType.MARKDOWN]: 'Markdown',
      [ContentType.LOG]: 'Log',
      [ContentType.CODE]: 'Code',
      [ContentType.TEXT]: 'Plain Text',
    };
    return names[contentType] || 'Unknown';
  }
}

let chunkerInstance: AdaptiveChunker | null = null;

function getAdaptiveChunker(
  initialChunkSize = 50000,
  minChunkSize = 50000,
  maxChunkSize = 200000
): AdaptiveChunker {
  if (!chunkerInstance) {
    chunkerInstance = new AdaptiveChunker(initialChunkSize, minChunkSize, maxChunkSize);
  }
  return chunkerInstance;
}

// CLI
function printUsage(): void {
  printHeader('Adaptive Chunker');
  console.log();
  console.log(`${colors.yellow}Usage:${colors.reset}`);
  console.log(`  bun run adaptive-chunker.ts <command> [args]`);
  console.log();
  console.log(`${colors.yellow}Commands:${colors.reset}`);
  console.log(`  ${colors.green}detect${colors.reset} <content>       Detect content type`);
  console.log(`  ${colors.green}chunk${colors.reset} <file> [options]   Create adaptive chunks`);
  console.log(`  ${colors.green}stats${colors.reset}                   Show chunker statistics`);
  console.log();
  console.log(`${colors.yellow}Chunk Options:${colors.reset}`);
  console.log(`  --output, -o <dir>      Output directory (default: .opencode/rlm_state/chunks)`);
  console.log(`  --max-chunks <n>        Maximum number of chunks`);
  console.log(`  --initial-size <n>      Initial chunk size (default: 50000)`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const chunker = new AdaptiveChunker();

  switch (command) {
    case 'detect':
      if (args.length < 2) {
        console.error(`${colors.red}Error: detect requires <content>${colors.reset}`);
        process.exit(1);
      }
      const contentType = chunker.detectContentType(args[1]);
      console.log(`Content Type: ${chunker.getContentTypeName(contentType)}`);
      console.log(`Enum: ${contentType}`);
      break;

    case 'chunk': {
      if (args.length < 2) {
        console.error(`${colors.red}Error: chunk requires <file>${colors.reset}`);
        process.exit(1);
      }
      
      const filepath = args[1];
      let output = '.opencode/rlm_state/chunks';
      let maxChunks: number | undefined;
      let initialSize = 50000;

      for (let i = 2; i < args.length; i++) {
        if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
          output = args[++i];
        } else if (args[i] === '--max-chunks' && args[i + 1]) {
          maxChunks = parseInt(args[++i], 10);
        } else if (args[i] === '--initial-size' && args[i + 1]) {
          initialSize = parseInt(args[++i], 10);
        }
      }

      if (!existsSync(filepath)) {
        console.error(`${colors.red}Error: File not found: ${filepath}${colors.reset}`);
        process.exit(1);
      }

      const content = readFileSync(filepath, 'utf-8');
      const chunkerWithSize = new AdaptiveChunker(initialSize);
      const detectedType = chunkerWithSize.detectContentType(content);

      console.log();
      console.log(`Chunking: ${filepath}`);
      console.log(`Content Type: ${chunkerWithSize.getContentTypeName(detectedType)}`);
      console.log(`Chunk Size: ${chunkerWithSize['chunkSize'].toLocaleString()} characters`);

      const chunkPaths = chunkerWithSize.createChunksFile(content, output, 'chunk');
      console.log(`Created ${chunkPaths.length} chunks`);
      console.log(`Output directory: ${output}`);
      break;
    }

    case 'stats': {
      const stats = chunker.getStats();
      console.log();
      console.log('Chunker Statistics:');
      console.log(`  Current chunk size: ${stats.current_chunk_size.toLocaleString()} characters`);
      console.log(`  Min chunk size: ${stats.min_chunk_size.toLocaleString()} characters`);
      console.log(`  Max chunk size: ${stats.max_chunk_size.toLocaleString()} characters`);
      console.log(`  Optimal time: ${(stats.optimal_time_ms / 1000).toFixed(1)}s`);
      console.log(`  Adjustments made: ${stats.adjustments_made}`);
      console.log(`  Avg processing time: ${(stats.avg_processing_time_ms / 1000).toFixed(1)}s`);
      console.log(`  Size adjustments: ${stats.size_adjustments}`);
      break;
    }

    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      printUsage();
      process.exit(1);
  }
}

export { AdaptiveChunker, ContentType, getAdaptiveChunker };
export type { ChunkResult, ChunkerStats };

main().catch(err => {
  console.error(`${colors.red}Error:${colors.reset}`, err.message);
  process.exit(1);
});
