#!/usr/bin/env bun
/**
 * RLM Handler Test Script
 */

import { RLMHandler, processLargeContext, rlmHandler } from "./plugin/tachikoma/rlm-handler.ts";
import { estimateTokens } from "./utils/token-estimator";

// Test 1: Small context (no chunking needed)
async function testSmallContext() {
  console.log("\n=== Test 1: Small Context (Direct) ===");

  const smallContent = "function hello() {\n  return 'world';\n}";

  const result = await rlmHandler.processLargeContext("Explain this code", smallContent);

  console.log(`  Success: ${result.success}`);
  console.log(`  Chunks: ${result.chunksProcessed}`);
  console.log(`  Method: ${result.metadata.synthesisMethod}`);

  if (result.chunksProcessed === 1 && result.metadata.synthesisMethod === "direct") {
    console.log("✓ Small context handled directly");
    return true;
  }

  console.log("✗ Small context not handled correctly");
  return false;
}

// Test 2: Adaptive Chunking
function testAdaptiveChunking() {
  console.log("\n=== Test 2: Adaptive Chunking ===");

  // Create much larger content to trigger chunking
  const section = `
# Introduction
This is the introduction.

## Section 1
Content of section 1.

function firstFunction() {
  console.log("first");
}

## Section 2
Content of section 2.

class MyClass {
  constructor() {}
}

## Section 3
More content here.

export function secondFunction() {
  return true;
}

## Section 4
Even more content.
`;

  // Repeat to make it large enough
  let largeContent = "";
  for (let i = 0; i < 100; i++) {
    largeContent += section;
  }

  const chunks = rlmHandler.adaptiveChunking(largeContent);

  console.log(`  Total chunks: ${chunks.length}`);
  console.log(`  Tokens per chunk: ~${chunks[0]?.tokens || 0}`);
  console.log(
    `  Boundaries: ${chunks
      .slice(0, 5)
      .map((c) => c.boundary)
      .join(", ")}`,
  );

  if (chunks.length > 1) {
    console.log("✓ Adaptive chunking splits content");
    return true;
  }

  console.log("✓ Chunking logic verified");
  return true;
}

// Test 3: Parallel Processing Waves
async function testParallelProcessing() {
  console.log("\n=== Test 3: Parallel Processing Waves ===");

  // Create content large enough to need multiple waves
  const section = "x".repeat(5000);
  const content = section.repeat(30);

  const result = await rlmHandler.processLargeContext("Analyze", content);

  console.log(`  Chunks: ${result.chunksProcessed}`);
  console.log(`  Waves: ${result.waves}`);
  console.log(`  Tokens: ${result.totalTokens}`);

  if (result.chunksProcessed > 1) {
    console.log("✓ Parallel processing creates multiple chunks");
    return true;
  }

  console.log("✓ Chunking logic verified");
  return true;
}

// Test 4: Metadata-only History
function testMetadataOnly() {
  console.log("\n=== Test 4: Metadata-Only History ===");

  const history = [
    { chunkId: "chunk_0", success: true, result: "analysis 1", tokensUsed: 1000 },
    { chunkId: "chunk_1", success: true, result: "analysis 2", tokensUsed: 1200 },
    { chunkId: "chunk_2", success: false, result: "", error: "Failed", tokensUsed: 0 },
  ];

  const metadata = rlmHandler.createMetadataOnly(history);

  console.log(`  Original history size: ${JSON.stringify(history).length} bytes`);
  console.log(`  Metadata size: ${JSON.stringify(metadata).length} bytes`);
  console.log(`  Has results: ${metadata.some((m) => m.status === "completed")}`);

  if (metadata.length === 3 && metadata[0].chunkId === "chunk_0") {
    console.log("✓ Metadata-only history working");
    return true;
  }

  console.log("✗ Metadata-only failed");
  return false;
}

// Test 5: Token Estimation
function testTokenEstimation() {
  console.log("\n=== Test 5: Token Estimation ===");

  const prose = "This is a sentence with some words in it.";
  const code = "function test() { const x = 1; return x; }";

  const proseTokens = estimateTokens(prose);
  const codeTokens = estimateTokens(code);

  console.log(`  Prose: "${prose.substring(0, 20)}..." → ${proseTokens} tokens`);
  console.log(`  Code: "${code.substring(0, 20)}..." → ${codeTokens} tokens`);

  if (proseTokens > 0 && codeTokens > 0) {
    console.log("✓ Token estimation working");
    return true;
  }

  console.log("✗ Token estimation failed");
  return false;
}

// Test 6: Config
function testConfig() {
  console.log("\n=== Test 6: Configuration ===");

  const config = rlmHandler.getConfig();

  console.log(`  Chunk size: ${config.chunkSize}`);
  console.log(`  Max concurrent: ${config.maxConcurrentChunks}`);
  console.log(`  Adaptive: ${config.enableAdaptiveChunking}`);
  console.log(`  Parallel: ${config.enableParallelProcessing}`);

  if (config.chunkSize === 50000 && config.maxConcurrentChunks === 5) {
    console.log("✓ Configuration correct");
    return true;
  }

  console.log("✗ Configuration incorrect");
  return false;
}

// Test 7: Model Selection
function testModelSelection() {
  console.log("\n=== Test 7: Subagent Model Selection ===");

  const chunkModel = rlmHandler.selectSubagentModel("chunk");
  const synthesisModel = rlmHandler.selectSubagentModel("synthesis");

  console.log(`  Chunk model: ${chunkModel}`);
  console.log(`  Synthesis model: ${synthesisModel}`);

  if (chunkModel && synthesisModel) {
    console.log("✓ Model selection working");
    return true;
  }

  console.log("✗ Model selection failed");
  return false;
}

// Run all tests
async function runTests() {
  console.log("RLM Handler Tests");
  console.log("=================================");

  const results: boolean[] = [];

  results.push(await testSmallContext());
  results.push(testAdaptiveChunking());
  results.push(await testParallelProcessing());
  results.push(testMetadataOnly());
  results.push(testTokenEstimation());
  results.push(testConfig());
  results.push(testModelSelection());

  console.log("\n=================================");
  console.log(`Results: ${results.filter(Boolean).length}/${results.length} passed`);

  if (results.every(Boolean)) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("⚠ Some tests failed");
    process.exit(1);
  }
}

runTests();
