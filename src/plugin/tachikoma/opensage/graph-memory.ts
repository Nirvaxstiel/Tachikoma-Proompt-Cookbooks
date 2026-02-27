import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import type {
  MemoryEdge,
  MemoryGraph,
  MemoryNode,
  MemoryQuery,
  MemoryQueryResult,
  SessionCompression,
} from "../../../types/opensage";

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw error;
    }
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(384).fill(0);

  for (const word of words) {
    const hash = hashString(word);
    for (let i = 0; i < 8; i++) {
      vector[(hash + i * 47) % 384] += 1;
    }
  }

  const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return mag === 0 ? vector : vector.map((v) => v / mag);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export const GraphMemoryPlugin = async ({ client, worktree }: Parameters<Plugin>[0]) => {
  const MEMORY_DIR = join(worktree, ".opencode", "memory");
  const GRAPH_FILE = join(MEMORY_DIR, "graph.json");
  const EMBEDDINGS_FILE = join(MEMORY_DIR, "embeddings.json");

  await ensureDir(MEMORY_DIR);

  async function loadGraph(): Promise<MemoryGraph> {
    const file = Bun.file(GRAPH_FILE);
    if (!file.exists()) {
      return { nodes: [], edges: [] };
    }
    try {
      const content = await file.text();
      return JSON.parse(content) as MemoryGraph;
    } catch {
      return { nodes: [], edges: [] };
    }
  }

  async function saveGraph(graph: MemoryGraph): Promise<void> {
    await writeFile(GRAPH_FILE, JSON.stringify(graph, null, 2));
  }

  async function loadEmbeddings(): Promise<Record<string, number[]>> {
    const file = Bun.file(EMBEDDINGS_FILE);
    if (!file.exists()) {
      return {};
    }
    try {
      return JSON.parse(await file.text());
    } catch {
      return {};
    }
  }

  async function saveEmbeddings(embeddings: Record<string, number[]>): Promise<void> {
    await writeFile(EMBEDDINGS_FILE, JSON.stringify(embeddings, null, 2));
  }

  return {
    "session.created": async () => {
      await ensureDir(MEMORY_DIR);
    },

    "tool.execute.after": async (input: any, output: any) => {
      if (input.agent && output.error) {
        const graph = await loadGraph();
        const eventNode: MemoryNode = {
          id: `event_${Date.now()}_${input.tool}`,
          type: "event",
          label: `Tool execution: ${input.tool}`,
          content: `Agent: ${input.agent}, Tool: ${input.tool}, Error: ${output.error}`,
          metadata: {
            agent: input.agent,
            tool: input.tool,
            error: output.error,
            timestamp: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        graph.nodes.push(eventNode);
        await saveGraph(graph);
      }
    },

    "session.compacted": async () => {
      const graph = await loadGraph();
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      graph.nodes = graph.nodes.filter((n) => {
        const timestamp = new Date(n.createdAt).getTime();
        if (n.type === "event" && timestamp < oneHourAgo) {
          return false;
        }
        return true;
      });

      await saveGraph(graph);
    },

    tool: {
      "memory-add-node": {
        description: "Add a node to knowledge graph",
        args: {
          type: {
            type: "string",
            enum: ["entity", "concept", "code", "query", "answer"],
          },
          label: { type: "string", description: "Node identifier/title" },
          content: { type: "string", description: "Node content/description" },
          metadata: { type: "object", optional: true },
        },
        async execute(args: any) {
          const node: MemoryNode = {
            id: `node_${Date.now()}_${hashString(args.label + Date.now())}`,
            type: args.type,
            label: args.label,
            content: args.content,
            metadata: args.metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          node.embedding = await generateEmbedding(args.label + " " + args.content);

          const graph = await loadGraph();
          graph.nodes.push(node);
          await saveGraph(graph);

          const embeddings = await loadEmbeddings();
          embeddings[node.id] = node.embedding;
          await saveEmbeddings(embeddings);

          return `Added node: ${node.id} (${args.type}: ${args.label})`;
        },
      },

      "memory-add-edge": {
        description: "Add a relationship edge between nodes",
        args: {
          fromId: { type: "string", description: "Source node ID" },
          toId: { type: "string", description: "Target node ID" },
          type: { type: "string", description: "Relationship type" },
          weight: { type: "number", description: "Edge weight (0-1)", optional: true },
        },
        async execute(args: any) {
          const edge: MemoryEdge = {
            from: args.fromId,
            to: args.toId,
            type: args.type,
            weight: args.weight !== undefined ? args.weight : 0.5,
          };

          const graph = await loadGraph();
          graph.edges.push(edge);
          await saveGraph(graph);

          return `Added edge: ${args.fromId} ->[${args.type}]-> ${args.toId}`;
        },
      },

      "memory-query": {
        description: "Query knowledge graph by similarity or pattern",
        args: {
          query: { type: "string", description: "Search query" },
          nodeType: {
            type: "string",
            enum: ["entity", "concept", "code", "query", "answer"],
            optional: true,
          },
          mode: {
            type: "string",
            enum: ["similarity", "pattern", "traverse"],
            optional: true,
          },
          maxResults: { type: "number", optional: true },
        },
        async execute(args: MemoryQuery) {
          const queryEmbedding = await generateEmbedding(args.query);
          const graph = await loadGraph();
          const embeddings = await loadEmbeddings();
          const mode = args.mode || "similarity";

          let results: MemoryQueryResult[] = [];

          if (mode === "similarity") {
            results = graph.nodes
              .filter((n) => !args.nodeType || n.type === args.nodeType)
              .map((node) => ({
                node,
                similarity: embeddings[node.id]
                  ? cosineSimilarity(queryEmbedding, embeddings[node.id])
                  : 0,
                relations: [],
              }))
              .filter((r) => r.similarity > 0.1)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, args.maxResults || 10);
          } else if (mode === "pattern") {
            const matchingNodes = graph.nodes.filter(
              (n) =>
                (!args.nodeType || n.type === args.nodeType) &&
                n.label.toLowerCase().includes(args.query.toLowerCase()),
            );
            results = matchingNodes.map((node) => ({ node, relations: [] }));
          } else if (mode === "traverse") {
            const startNodes = graph.nodes.filter((n) =>
              n.label.toLowerCase().includes(args.query.toLowerCase()),
            );
            const visited = new Set<string>();
            const resultsMap = new Map<string, MemoryNode>();

            for (const startNode of startNodes) {
              if (visited.has(startNode.id)) continue;
              const queue = [{ nodeId: startNode.id, depth: 0 }];
              const maxDepth = 2;

              while (queue.length > 0) {
                const { nodeId, depth } = queue.shift()!;
                if (visited.has(nodeId) || depth > maxDepth) continue;

                visited.add(nodeId);
                const node = graph.nodes.find((n) => n.id === nodeId);
                if (node) resultsMap.set(nodeId, node);

                const neighbors = graph.edges
                  .filter((e) => e.from === nodeId || e.to === nodeId)
                  .map((e) => (e.from === nodeId ? e.to : e.from))
                  .filter((id) => !visited.has(id));

                for (const neighborId of neighbors) {
                  queue.push({ nodeId: neighborId, depth: depth + 1 });
                }
              }
            }

            results = Array.from(resultsMap.values()).map((node) => ({ node, relations: [] }));
          }

          for (const result of results) {
            const relatedEdges = graph.edges.filter(
              (e) => e.from === result.node.id || e.to === result.node.id,
            );
            result.relations = relatedEdges.map((e) =>
              e.from === result.node.id ? `→[${e.type}]→ ${e.to}` : `←[${e.type}]← ${e.from}`,
            );
          }

          return formatResults(results);
        },
      },

      "memory-compress-session": {
        description: "Compress session events into knowledge graph",
        args: {
          sessionId: { type: "string", description: "Session ID to compress" },
          retainTypes: {
            type: "array",
            items: { type: "string" },
            optional: true,
            description: "Event types to retain",
          },
        },
        async execute(args: any, context: any) {
          const session = await client.session.get({ path: { id: args.sessionId } });
          const messages = await client.session.messages({ path: { id: args.sessionId } });

          const { nodes, edges } = await extractEntitiesFromMessages(messages, session);

          const graph = await loadGraph();
          graph.nodes.push(...nodes);
          graph.edges.push(...edges);
          await saveGraph(graph);

          for (const node of nodes) {
            if (node.embedding) continue;
            node.embedding = await generateEmbedding(node.label + " " + node.content);
            const embeddings = await loadEmbeddings();
            embeddings[node.id] = node.embedding;
            await saveEmbeddings(embeddings);
          }

          return `Compressed session ${args.sessionId} into ${nodes.length} nodes and ${edges.length} edges`;
        },
      },

      "memory-visualize": {
        description: "Generate a visualization of memory graph",
        args: {
          centerNode: { type: "string", optional: true },
          radius: { type: "number", optional: true },
        },
        async execute(args: any) {
          const graph = await loadGraph();
          let subset = graph.nodes;

          if (args.centerNode) {
            subset = extractSubgraph(graph, args.centerNode, args.radius || 2);
          }

          const mermaid = generateMermaidDiagram(subset, graph.edges);

          return {
            format: "mermaid",
            diagram: mermaid,
            render_url: "https://mermaid.live/edit",
          };
        },
      },
    },
  };
};

async function extractEntitiesFromMessages(
  messages: any[],
  session: any,
): Promise<{ nodes: MemoryNode[]; edges: MemoryEdge[] }> {
  const nodes: MemoryNode[] = [];
  const edges: MemoryEdge[] = [];

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text") {
        const lines = part.text.split("\n");
        for (const line of lines) {
          const match = line.match(/```(\w+)?\n([\s\S]+?)```/);
          if (match) {
            const language = match[1] || "unknown";
            const content = match[2];
            const nodeId = `code_${hashString(content.substring(0, 50))}`;

            const node: MemoryNode = {
              id: nodeId,
              type: "code",
              label: `${language} code snippet`,
              content: content.substring(0, 200),
              metadata: {
                language,
                fullContent: content.length > 200 ? content : undefined,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            nodes.push(node);
          }
        }
      }
    }
  }

  return { nodes, edges };
}

function extractSubgraph(graph: MemoryGraph, centerIdParam: string, radius: number): MemoryNode[] {
  const centerNode = graph.nodes.find((n) => n.id === centerIdParam);
  if (!centerNode) return [];

  const visited = new Set<string>();
  const result: MemoryNode[] = [];
  const queue: Array<{ nodeId: string, depth: number }> = [{ nodeId: centerIdParam, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    if (visited.has(nodeId) || depth > radius) continue;

    visited.add(nodeId);
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) result.push(node);

    const neighbors = graph.edges
      .filter((e) => e.from === nodeId || e.to === nodeId)
      .map((e) => (e.from === nodeId ? e.to : e.from))
      .filter((id) => !visited.has(id));

    for (const neighborId of neighbors) {
      queue.push({ nodeId: neighborId, depth: depth + 1 });
    }
  }

  return result;
}

function generateMermaidDiagram(nodes: MemoryNode[], edges: MemoryEdge[]): string {
  const nodeMap = new Map(nodes.map((n) => [n.id, n.label.replace(/\W+/g, "_")]));

  let diagram = "graph LR\n";

  const typeColors: Record<string, string> = {
    entity: "#90EE90",
    concept: "#87CEEB",
    code: "#FFB6C1",
    query: "#DDA0DD",
    answer: "#FFD700",
  };

  for (const node of nodes) {
    const shortLabel = node.label.substring(0, 15);
    const safeLabel = nodeMap.get(node.id) || "unknown";
    diagram += `  ${safeLabel}["${shortLabel}"]:::${node.type}\n`;
  }

  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (from && to) {
      diagram += `  ${from} -- "${edge.type}" --> ${to}\n`;
    }
  }

  diagram += "\n  classDef entity fill:#90EE90,stroke:#333\n";
  diagram += "  classDef concept fill:#87CEEB,stroke:#333\n";
  diagram += "  classDef code fill:#FFB6C1,stroke:#333\n";
  diagram += "  classDef query fill:#DDA0DD,stroke:#333\n";
  diagram += "  classDef answer fill:#FFD700,stroke:#333\n";

  return diagram;
}

function formatResults(results: MemoryQueryResult[]): string {
  return results
    .map((r) => {
      const relations = r.relations.join(", ") || "none";
      return `**${r.node.label}** (${r.node.type})
- Content: ${r.node.content.substring(0, 100)}...
- Relations: ${relations}
- Similarity: ${r.similarity?.toFixed(3) || "N/A"}`;
    })
    .join("\n\n");
}
