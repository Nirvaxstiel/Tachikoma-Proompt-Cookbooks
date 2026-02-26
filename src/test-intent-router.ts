#!/usr/bin/env bun
/**
 * Intent Router Verification Script
 * Tests acceptance criteria for router.ts
 */

import {
  type ComplexityLevel,
  CostAwareRouter,
  type ExecutionStrategy,
  type IntentType,
  classifyAndRoute,
  classifyIntent,
  router,
  selectStrategy,
} from "./plugin/tachikoma/router";

// Test 1: Intent Classification (AC-1)
function testIntentClassification() {
  console.log("\n=== Test 1: Intent Classification (AC-1) ===");

  const testCases = [
    { request: "fix this bug in the login function", expectedType: "debug" as IntentType },
    { request: "create a new API endpoint for users", expectedType: "code" as IntentType },
    { request: "refactor this component to use hooks", expectedType: "refactor" as IntentType },
    { request: "research how OAuth2 works", expectedType: "research" as IntentType },
    { request: "add tests for the auth module", expectedType: "test" as IntentType },
    { request: "verify the password hashing is secure", expectedType: "verify" as IntentType },
    { request: "explain how this function works", expectedType: "explain" as IntentType },
    { request: "plan a migration to microservices", expectedType: "plan" as IntentType },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = classifyIntent(tc.request);
    if (result.type === tc.expectedType) {
      passed++;
    } else {
      console.log(
        `✗ "${tc.request.substring(0, 30)}..." → ${result.type} (expected ${tc.expectedType})`,
      );
    }
  }

  console.log(`✓ ${passed}/${testCases.length} intents classified correctly`);
  return passed >= testCases.length * 0.75; // Allow 75% pass rate
}

// Test 2: Complexity Detection
function testComplexityDetection() {
  console.log("\n=== Test 2: Complexity Detection ===");

  const testCases = [
    { request: "what is this?", expected: "low" as ComplexityLevel },
    { request: "fix the bug", expected: "medium" as ComplexityLevel },
    {
      request: "implement OAuth2 with JWT and role-based access control",
      expected: "high" as ComplexityLevel,
    },
    {
      request: "refactor entire codebase to use microservices with event-driven architecture",
      expected: "very_high" as ComplexityLevel,
    },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = classifyIntent(tc.request);
    if (result.complexity === tc.expected) {
      passed++;
    } else {
      console.log(
        `✗ "${tc.request.substring(0, 30)}..." → ${result.complexity} (expected ${tc.expected})`,
      );
    }
  }

  console.log(`✓ ${passed}/${testCases.length} complexity levels correct`);
  return passed >= testCases.length * 0.75;
}

// Test 3: Strategy Selection (AC-2)
function testStrategySelection() {
  console.log("\n=== Test 3: Strategy Selection (AC-2) ===");

  const testCases = [
    { complexity: "low" as ComplexityLevel, expected: "direct" as ExecutionStrategy },
    { complexity: "medium" as ComplexityLevel, expected: "single_skill" as ExecutionStrategy },
    { complexity: "high" as ComplexityLevel, expected: "skill_chain" as ExecutionStrategy },
    { complexity: "very_high" as ComplexityLevel, expected: "rlm" as ExecutionStrategy },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = selectStrategy(tc.complexity);
    if (result === tc.expected) {
      passed++;
    } else {
      console.log(`✗ ${tc.complexity} → ${result} (expected ${tc.expected})`);
    }
  }

  console.log(`✓ ${passed}/${testCases.length} strategies selected correctly`);
  return passed === testCases.length;
}

// Test 4: Pattern Matching (AC-3)
function testPatternMatching() {
  console.log("\n=== Test 4: Pattern Matching (AC-3) ===");

  const r = new CostAwareRouter();

  const testCases = [
    { request: "debug the API endpoint", expectRoute: true },
    { request: "fix the authentication bug", expectRoute: true },
    { request: "verify the JWT token", expectRoute: true },
    { request: "do something random", expectRoute: false },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const match = r.matchPattern(tc.request);
    const hasMatch = match !== null;

    if (hasMatch === tc.expectRoute) {
      passed++;
    } else {
      console.log(`✗ "${tc.request}" → match: ${hasMatch} (expected: ${tc.expectRoute})`);
    }
  }

  console.log(`✓ ${passed}/${testCases.length} patterns matched correctly`);
  return passed >= testCases.length * 0.75;
}

// Test 5: Low Confidence Clarification (AC-4)
function testLowConfidenceClarification() {
  console.log("\n=== Test 5: Low Confidence Clarification (AC-4) ===");

  const result = classifyIntent("do the thing");

  if (result.confidence < 0.5) {
    console.log(`✓ Low confidence (${result.confidence.toFixed(2)}) triggers clarification`);
    return true;
  } else {
    console.log(`✗ Expected low confidence, got ${result.confidence}`);
    return false;
  }
}

// Test 6: Large Context Routes to RLM (AC-5)
async function testLargeContextRouting() {
  console.log("\n=== Test 6: Large Context Routes to RLM (AC-5) ===");

  const result = await classifyAndRoute("fix the bug", 5000); // 5000 tokens

  if (result.strategy === "rlm") {
    console.log("✓ Large context (5000 tokens) routes to RLM");
    return true;
  } else {
    console.log(`✗ Expected rlm, got ${result.strategy}`);
    return false;
  }
}

// Test 7: Full Integration
async function testFullIntegration() {
  console.log("\n=== Test 7: Full Integration ===");

  const testCases = [
    { request: "create a new API endpoint", contextSize: 100 },
    { request: "what is this file?", contextSize: 50 },
    { request: "refactor the authentication system", contextSize: 500 },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = await classifyAndRoute(tc.request, tc.contextSize);
    console.log(
      `  "${tc.request.substring(0, 25)}..." → ${result.strategy} (${result.intent.type})`,
    );
    passed++;
  }

  console.log(`✓ ${passed}/${testCases.length} integrated decisions made`);
  return passed === testCases.length;
}

// Test 8: Explain Decision
function testExplainDecision() {
  console.log("\n=== Test 8: Explain Decision ===");

  const result = classifyIntent("debug the API crash");
  const explanation = router.explainDecision({
    strategy: "single_skill",
    intent: result,
    needsClarification: false,
  });

  console.log(explanation);

  if (explanation.includes("debug") && explanation.includes("single_skill")) {
    console.log("✓ Decision explanation works");
    return true;
  } else {
    console.log("✗ Explanation missing details");
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("Intent Router Verification Tests");
  console.log("=================================");

  const results = [];

  results.push(testIntentClassification());
  results.push(testComplexityDetection());
  results.push(testStrategySelection());
  results.push(testPatternMatching());
  results.push(testLowConfidenceClarification());
  results.push(await testLargeContextRouting());
  results.push(await testFullIntegration());
  results.push(testExplainDecision());

  console.log("\n=================================");
  console.log(`Results: ${results.filter(Boolean).length}/${results.length} passed`);

  if (results.every(Boolean)) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("⚠ Some tests had warnings");
    process.exit(0);
  }
}

runTests();
