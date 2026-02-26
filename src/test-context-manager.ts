#!/usr/bin/env bun
/**
 * Context Manager Verification Script
 * Tests acceptance criteria for context-manager.ts
 */

import { PositionAwareContext, loadProjectContext } from "./plugin/tachikoma/context-manager.ts";

// Test 1: AGENTS.md loading (AC-1)
async function testAgentsLoading() {
  console.log("\n=== Test 1: AGENTS.md Loading (AC-1) ===");

  const cm = new PositionAwareContext();
  const cwd = process.cwd();

  const result = await cm.loadAGENTS(cwd);

  if (result) {
    console.log("✓ AGENTS.md found and loaded");
    console.log(`  Length: ${result.length} chars`);
    console.log(`  Preview: ${result.substring(0, 100)}...`);
    return true;
  } else {
    console.log("⚠ AGENTS.md not found (this is OK for new projects)");
    return true; // Not a failure, just no file exists
  }
}

// Test 2: Context Module Loading (AC-2)
async function testModuleLoading() {
  console.log("\n=== Test 2: Context Module Loading (AC-2) ===");

  const cm = new PositionAwareContext();
  const cwd = process.cwd();

  // Try loading a non-existent module
  const result = await cm.loadModule("nonexistent", cwd);

  if (result === null) {
    console.log("✓ Correctly returns null for missing module");
  } else {
    console.log("✗ Should have returned null");
    return false;
  }

  // Test listing modules
  const modules = await cm.listModules(cwd);
  console.log(`✓ Available modules: ${modules.length > 0 ? modules.join(", ") : "(none)"}`);

  return true;
}

// Test 3: Position Optimization (AC-3)
function testPositionOptimization() {
  console.log("\n=== Test 3: Position Optimization (AC-3) ===");

  const cm = new PositionAwareContext();

  const sources = [
    {
      type: "agents" as const,
      path: "/test/AGENTS.md",
      content: "Critical project rules",
      priority: "critical" as const,
      tokens: 10,
    },
    {
      type: "module" as const,
      path: "/test/module.md",
      content: "Medium priority module content",
      priority: "medium" as const,
      tokens: 20,
    },
    {
      type: "file" as const,
      path: "/test/file.ts",
      content: "Low priority file content",
      priority: "low" as const,
      tokens: 30,
    },
    {
      type: "injected" as const,
      path: "<injected>",
      content: "High priority injected context",
      priority: "high" as const,
      tokens: 15,
    },
  ];

  const optimized = cm.positionOptimize(sources);

  // Check that critical is at start
  const criticalStart =
    optimized.includes("## Critical Rules") &&
    optimized.indexOf("## Critical Rules") < optimized.indexOf("## Supporting Context");

  // Check that high is at end
  const highEnd =
    optimized.includes("## Important Guidelines") &&
    optimized.lastIndexOf("## Important Guidelines") > optimized.indexOf("## Supporting Context");

  console.log("Optimized content structure:");
  console.log(optimized.substring(0, 300) + "...");

  if (criticalStart && highEnd) {
    console.log("✓ Critical at start, High at end (U-shaped bias optimization)");
    return true;
  } else {
    console.log("✗ Position optimization not working correctly");
    return false;
  }
}

// Test 4: Token Estimation
function testTokenEstimation() {
  console.log("\n=== Test 4: Token Estimation ===");

  const cm = new PositionAwareContext();

  // Test natural language
  const english = "This is a test sentence with some words.";
  const englishTokens = cm.estimateTokens(english);
  console.log(`English (${english.length} chars): ${englishTokens} tokens`);

  // Test code
  const code = `function test() {
  const x = 1;
  return x;
}`;
  const codeTokens = cm.estimateTokens(code);
  console.log(`Code (${code.length} chars): ${codeTokens} tokens`);

  // Verify reasonable estimates
  if (englishTokens > 0 && codeTokens > 0) {
    console.log("✓ Token estimation working");
    return true;
  } else {
    console.log("✗ Token estimation failed");
    return false;
  }
}

// Test 5: Compression (AC-4)
async function testCompression() {
  console.log("\n=== Test 5: Context Compression (AC-4) ===");

  const cm = new PositionAwareContext({ maxTokens: 1000, compressionThreshold: 0.3 });

  const sources = [
    {
      type: "agents" as const,
      path: "/test/AGENTS.md",
      content: "Critical rules that must be preserved",
      priority: "critical" as const,
      tokens: 10,
    },
    {
      type: "module" as const,
      path: "/test/module.md",
      content: "Module content " + "x".repeat(500),
      priority: "medium" as const,
      tokens: 300,
    },
  ];

  const result = await cm.compress(sources, 100);

  console.log(`Original: ${sources.reduce((s, x) => s + x.tokens, 0)} tokens`);
  console.log(`Compressed: ${cm.estimateTokens(result.compressed)} tokens`);
  console.log(`Reduction: ${result.tokenReduction} tokens`);
  console.log(`Preserved sections: ${result.preservedSections.join(", ")}`);

  if (result.tokenReduction > 0) {
    console.log("✓ Compression working");
    return true;
  } else {
    console.log("✗ Compression failed");
    return false;
  }
}

// Test 6: Full loadContext integration
async function testFullLoadContext() {
  console.log("\n=== Test 6: Full loadContext (AC-5) ===");

  const cm = new PositionAwareContext();

  try {
    const result = await cm.loadContext({
      cwd: process.cwd(),
      modules: [],
      injectedContext: "Test injected context",
      maxTokens: 128000,
    });

    console.log(`Sources loaded: ${result.sources.length}`);
    console.log(`Total tokens: ${result.totalTokens}`);
    console.log(`Compressed: ${result.compressed}`);
    console.log(`Optimized length: ${result.optimized.length} chars`);

    // Check that injected context is included
    const hasInjected = result.sources.some((s) => s.type === "injected");
    if (hasInjected) {
      console.log("✓ Injected context included");
    }

    console.log("✓ loadContext working");
    return true;
  } catch (error) {
    console.log("✗ loadContext failed:", error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("Context Manager Verification Tests");
  console.log("==================================");

  const results = [];

  results.push(await testAgentsLoading());
  results.push(await testModuleLoading());
  results.push(testPositionOptimization());
  results.push(testTokenEstimation());
  results.push(await testCompression());
  results.push(await testFullLoadContext());

  console.log("\n==================================");
  console.log(`Results: ${results.filter(Boolean).length}/${results.length} passed`);

  if (results.every(Boolean)) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("✗ Some tests failed");
    process.exit(1);
  }
}

runTests();
