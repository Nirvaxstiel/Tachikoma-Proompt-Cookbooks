#!/usr/bin/env bun
/**
 * Hashline Edit Format Processor
 *
 * Based on: Can Bölük's "The Harness Problem" research
 * Reference: https://blog.can.ac/2026/02/12/the-harness-problem
 *
 * Impact: +8-61% edit success rate, especially for weak models
 * - Grok: 6.7% → 68.3% (10x improvement)
 * - GLM: 46-50% → 54-64% (+8-14%)
 * - Claude/GPT: Already high, minor improvements
 * - Output tokens: -20-61% reduction
 *
 * Converted from hashline-processor.py
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// =============================================================================
// TYPES
// =============================================================================

export interface HashlineResult {
  success: boolean;
  hashline: string;
  lineContent: string;
}

export interface FileStats {
  totalLines: number;
  totalChars: number;
  hashLength: number;
  hashSpaceSize: number;
  avgLineLength: number;
  firstHash: string | null;
  lastHash: string | null;
}

export interface VerifyResult {
  valid: boolean;
  linesChecked?: number;
  message: string;
  error?: string;
}

// =============================================================================
// HASHLINE PROCESSOR
// =============================================================================

export class HashlineProcessor {
  private hashLength: number;

  constructor(hashLength: number = 4) {
    this.hashLength = hashLength; // 4 chars = 16M possibilities
  }

  /**
   * Generate hash for a single line
   */
  private hashLine(line: string): string {
    return createHash("sha256")
      .update(line)
      .digest("hex")
      .slice(0, this.hashLength);
  }

  /**
   * Generate hashline reference for a specific line
   *
   * @param content - Full file content
   * @param lineNumber - 1-based line number
   * @returns Hashline reference string (e.g., "22:a3f1|")
   */
  generateHashline(content: string, lineNumber: number): string {
    const lines = content.split("\n");

    if (lineNumber < 1 || lineNumber > lines.length) {
      throw new Error(
        `Line ${lineNumber} out of range (file has ${lines.length} lines)`,
      );
    }

    const line = lines[lineNumber - 1];
    const lineHash = this.hashLine(line);
    return `${lineNumber}:${lineHash}|`;
  }

  /**
   * Read file and return lines with hashline prefixes
   *
   * @param filepath - Path to file
   * @returns Array of lines with hashline prefixes
   *
   * @example
   * Input file:
   *   function hello() {
   *     return "world";
   *   }
   *
   * Output:
   *   [
   *     "1:a3f1|function hello() {",
   *     "2:f1a2|  return \"world\";",
   *     "3:0e3d|}"
   *   ]
   */
  readFileWithHashlines(filepath: string): string[] {
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const content = readFileSync(filepath, "utf-8");
    const lines = content.split("\n");

    return lines.map((line, index) => {
      const lineHash = this.hashLine(line);
      return `${index + 1}:${lineHash}|${line}`;
    });
  }

  /**
   * Apply edit using hashline reference
   *
   * @param filepath - Path to file to edit
   * @param targetHash - Hashline reference (e.g., "22:a3f1")
   * @param newContent - New line content
   * @returns True if edit succeeded
   */
  applyHashlineEdit(
    filepath: string,
    targetHash: string,
    newContent: string,
  ): boolean {
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const currentHashlines = this.readFileWithHashlines(filepath);

    // Build hash -> index map
    const hashToIndex = new Map<string, number>();
    for (const [idx, hashline] of currentHashlines.entries()) {
      const hashPrefix = hashline.split("|")[0];
      hashToIndex.set(hashPrefix, idx);
    }

    if (!hashToIndex.has(targetHash)) {
      const existingHashes = Array.from(hashToIndex.keys());
      const lineNumber = targetHash.includes(":")
        ? targetHash.split(":")[0]
        : "?";

      throw new Error(
        `Hash '${targetHash}' not found in file.\n` +
          `Line number: ${lineNumber}\n` +
          `File may have changed. Current hashes in file: ${existingHashes.length}\n` +
          `First 5 hashes: ${existingHashes.slice(0, 5).join(", ")}`,
      );
    }

    const lineIndex = hashToIndex.get(targetHash)!;

    const content = readFileSync(filepath, "utf-8");
    const lines = content.split("\n");

    // Preserve original newline style
    const originalLine = lines[lineIndex];
    lines[lineIndex] = newContent;

    writeFileSync(filepath, lines.join("\n"), "utf-8");

    return true;
  }

  /**
   * Find a line by content and return its hashline reference
   *
   * @param filepath - Path to file
   * @param searchText - Text to search for
   * @param caseSensitive - Whether to match case
   * @returns Hashline reference if found, null otherwise
   */
  findHashLine(
    filepath: string,
    searchText: string,
    caseSensitive: boolean = false,
  ): string | null {
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const hashlines = this.readFileWithHashlines(filepath);
    const search = caseSensitive ? searchText : searchText.toLowerCase();

    for (const hashline of hashlines) {
      const pipeIndex = hashline.indexOf("|");
      const content = hashline.slice(pipeIndex + 1);
      const matchContent = caseSensitive ? content : content.toLowerCase();

      if (matchContent.includes(search)) {
        const hashPrefix = hashline.split("|")[0];
        return hashPrefix + "|";
      }
    }

    return null;
  }

  /**
   * Find multiple lines by content
   */
  batchFindHashLines(
    filepath: string,
    searchTexts: string[],
    caseSensitive: boolean = false,
  ): Map<string, string | null> {
    const results = new Map<string, string | null>();

    for (const searchText of searchTexts) {
      const hashRef = this.findHashLine(filepath, searchText, caseSensitive);
      results.set(searchText, hashRef);
    }

    return results;
  }

  /**
   * Get statistics about a file
   */
  getFileStats(filepath: string): FileStats {
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const hashlines = this.readFileWithHashlines(filepath);

    return {
      totalLines: hashlines.length,
      totalChars: hashlines.reduce((sum, h) => sum + h.length, 0),
      hashLength: this.hashLength,
      hashSpaceSize: Math.pow(16, this.hashLength),
      avgLineLength:
        hashlines.length > 0
          ? hashlines.reduce((sum, h) => sum + h.length, 0) / hashlines.length
          : 0,
      firstHash: hashlines.length > 0 ? hashlines[0].split("|")[0] : null,
      lastHash:
        hashlines.length > 0
          ? hashlines[hashlines.length - 1].split("|")[0]
          : null,
    };
  }

  /**
   * Verify hashline integrity of a file
   */
  verifyIntegrity(filepath: string): VerifyResult {
    try {
      const hashlines = this.readFileWithHashlines(filepath);
      return {
        valid: true,
        linesChecked: hashlines.length,
        message: `All ${hashlines.length} lines have valid hashlines`,
      };
    } catch (e) {
      const error = e as Error;
      return {
        valid: false,
        message: `Hashline verification failed: ${error.message}`,
        error: error.message,
      };
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let _processorInstance: HashlineProcessor | null = null;

export function getHashlineProcessor(): HashlineProcessor {
  if (!_processorInstance) {
    _processorInstance = new HashlineProcessor();
  }
  return _processorInstance;
}

// =============================================================================
// CLI
// =============================================================================

function printUsage(): void {
  console.log(`
Hashline Edit Format Processor

Usage:
  bun run hashline.ts <command> [args]

Commands:
  read <filepath>              Read file with hashlines
  find <filepath> <text>       Find line by content
  edit <filepath> <hash> <content>  Edit file using hashline
  verify <filepath>            Verify hashline integrity
  stats <filepath>             Show file statistics

Examples:
  bun run hashline.ts read src/file.py
  bun run hashline.ts find src/file.py "return"
  bun run hashline.ts edit src/file.py "22:a3f1" "new content"
`);
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return 0;
  }

  const command = args[0];
  const processor = new HashlineProcessor();

  try {
    switch (command) {
      case "read": {
        const filepath = args[1];
        if (!filepath) {
          console.error("Error: filepath required");
          return 1;
        }
        const hashlines = processor.readFileWithHashlines(filepath);
        for (const line of hashlines) {
          console.log(line);
        }
        break;
      }

      case "find": {
        const filepath = args[1];
        const searchText = args[2];
        if (!filepath || !searchText) {
          console.error("Error: filepath and search text required");
          return 1;
        }
        const hashRef = processor.findHashLine(filepath, searchText);
        if (hashRef) {
          console.log(`Found: ${hashRef}`);
        } else {
          console.log(`Not found: '${searchText}'`);
          return 1;
        }
        break;
      }

      case "edit": {
        const filepath = args[1];
        const hash = args[2];
        const content = args[3];
        if (!filepath || !hash || content === undefined) {
          console.error("Error: filepath, hash, and content required");
          return 1;
        }
        const success = processor.applyHashlineEdit(filepath, hash, content);
        if (success) {
          console.log(`✓ Edit successful: ${hash} -> '${content}'`);
        } else {
          console.log("✗ Edit failed");
          return 1;
        }
        break;
      }

      case "verify": {
        const filepath = args[1];
        if (!filepath) {
          console.error("Error: filepath required");
          return 1;
        }
        const result = processor.verifyIntegrity(filepath);
        if (result.valid) {
          console.log(`✓ ${result.message}`);
        } else {
          console.log(`✗ ${result.message}`);
          return 1;
        }
        break;
      }

      case "stats": {
        const filepath = args[1];
        if (!filepath) {
          console.error("Error: filepath required");
          return 1;
        }
        const stats = processor.getFileStats(filepath);
        console.log(JSON.stringify(stats, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        return 1;
    }
  } catch (e) {
    const error = e as Error;
    console.error(`✗ Error: ${error.message}`);
    return 1;
  }

  return 0;
}

// Run CLI if executed directly
if (import.meta.path === process.argv[1]) {
  process.exit(await main());
}
