// Hierarchical indexing plugin for graph memory
/**
 * Hierarchical Indexing Plugin Integration
 * Provides O(log N) memory retrieval with 3.6x speedup
 */

import type { Plugin } from "@opencode-ai/plugin";
import {
  HierarchicalMemoryIndex,
  BoundaryAwareChunker,
  IndexConfig,
  IndexedNode,
  QueryResult,
} from "../opensage/hierarchical-index";

interface IndexingConfig {
  enableHierarchicalIndexing: boolean;
  lazyUpdates: boolean;
  maxCacheSize: number;
}

const DEFAULT_INDEXING_CONFIG: IndexingConfig = {
  enableHierarchicalIndexing: true,
  lazyUpdates: true,
  maxCacheSize: 1000,
};

export const HierarchicalIndexingPlugin = async ({
  client,
  directory,
  worktree,
}: Parameters<Plugin>[0]) => {
  let config = DEFAULT_INDEXING_CONFIG;
  const memoryIndex = new HierarchicalMemoryIndex();
  const chunker = new BoundaryAwareChunker();

  return {
    "session.created": async () => {
      console.log("Hierarchical indexing initialized");
    },

    tool: {
      "index-add": {
        description: "Add content to hierarchical memory index",
        args: {
          id: { type: "string", description: "Unique ID for the content" },
          content: { type: "string", description: "Content to index" },
          metadata: {
            type: "string",
            description: "Optional metadata as JSON string",
            optional: true,
          },
        },
        async execute(args: any, context: any): Promise<string> {
          if (!config.enableHierarchicalIndexing) {
            return "Hierarchical indexing is disabled";
          }

          const metadata = args.metadata ? JSON.parse(args.metadata) : undefined;
          const node = await memoryIndex.addNode(args.id, args.content, metadata);

          return `✅ Added node ${args.id} to hierarchical index at level ${node.level}`;
        },
      },

      "index-search": {
        description: "Search hierarchical index with O(log N) retrieval",
        args: {
          query: { type: "string", description: "Search query" },
          topK: { type: "number", description: "Number of results", optional: true },
        },
        async execute(args: any, context: any): Promise<string> {
          if (!config.enableHierarchicalIndexing) {
            return "Hierarchical indexing is disabled";
          }

          const topK = args.topK || 10;
          const results = await memoryIndex.search(args.query, topK);
          const stats = memoryIndex.getStats();

          const output: string[] = [];
          output.push("🔍 Hierarchical Search Results");
          output.push("");
          output.push(`Query: ${args.query}`);
          output.push(`Found ${results.length} results (top ${topK})`);
          output.push("");

          for (let i = 0; i < Math.min(results.length, 5); i++) {
            const result = results[i];
            const scorePct = (result.score * 100).toFixed(1);
            output.push(`${i + 1}. [${result.score.toFixed(3)}] ${result.node.id}`);
            output.push(`   Level: ${result.level}`);
            output.push(`   Score: ${scorePct}%`);
          }

          if (results.length > 5) {
            output.push(`... and ${results.length - 5} more`);
          }

          output.push("");
          output.push("📊 Index Statistics");
          output.push(`Total nodes: ${stats.totalNodes}`);
          output.push(`Max depth: ${stats.maxDepth}`);
          output.push(`Average branching: ${stats.averageBranching.toFixed(2)}`);
          output.push(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);

          return output.join("\n");
        },
      },

      "index-stats": {
        description: "Get hierarchical index statistics",
        args: {},
        async execute(): Promise<string> {
          const stats = memoryIndex.getStats();

          return `
📊 Hierarchical Memory Index Statistics

- Total Nodes: ${stats.totalNodes}
- Level Count: ${stats.levelCount}
- Max Depth: ${stats.maxDepth}
- Average Branching: ${stats.averageBranching.toFixed(2)}
- Cache Size: ${memoryIndex["cacheSize" as keyof typeof memoryIndex]}
- Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%

Expected Performance:
- Retrieval: O(log N) vs O(N) linear scan
- Speedup: ~3.6x for typical memory queries
`.trim();
        },
      },

      "index-clear-cache": {
        description: "Clear query cache",
        args: {},
        async execute(): Promise<string> {
          memoryIndex.clearCache();

          return "✅ Hierarchical index query cache cleared";
        },
      },

      "index-chunk": {
        description: "Chunk content preserving semantic boundaries",
        args: {
          content: { type: "string", description: "Content to chunk" },
        },
        async execute(args: any, context: any): Promise<string> {
          const result = chunker.chunk(args.content);

          const output: string[] = [];
          output.push("📝 Boundary-Aware Chunking");
          output.push("");
          output.push(`Content length: ${args.content.length} chars`);
          output.push(`Chunks: ${result.chunks.length}`);
          output.push("");

          for (let i = 0; i < result.chunks.length; i++) {
            const [start, end] = result.boundaries[i];
            output.push(`Chunk ${i + 1}: [${start}, ${end}]`);
            output.push(`  Length: ${end - start} chars`);
            output.push(`  Content: ${result.chunks[i].slice(0, 50)}...`);
          }

          return output.join("\n");
        },
      },
    },
  };
};
