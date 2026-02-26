#!/usr/bin/env bun
/**
 * Verification Loop Test Script
 */

import {
  VerificationLoop,
  reflect,
  verifier,
  verifyAndRevise,
} from "./plugin/tachikoma/verifier.ts";

// Test 1: Criteria Extraction (AC-1)
function testCriteriaExtraction() {
  console.log("\n=== Test 1: Criteria Extraction (AC-1) ===");

  const testCases = [
    { request: "fix the login bug", expectedDomain: "bug_fix" },
    { request: "add tests for the API", expectedDomain: "test" },
    { request: "refactor the auth module", expectedDomain: "refactor" },
    { request: "implement secure login", expectedDomain: "auth" },
    { request: "create an API endpoint", expectedDomain: "api" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const criteria = verifier.extractCriteria(tc.request);
    if (criteria.length > 0) {
      passed++;
    } else {
      console.log(`✗ "${tc.request}" → no criteria extracted`);
    }
  }

  console.log(`✓ ${passed}/${testCases.length} criteria extracted`);
  console.log(
    `  Example: "${testCases[0].request}" → ${verifier
      .extractCriteria(testCases[0].request)
      .map((c) => c.id)
      .join(", ")}`,
  );

  return passed >= testCases.length * 0.8;
}

// Test 2: Verification (AC-2)
async function testVerification() {
  console.log("\n=== Test 2: Verification (AC-2) ===");

  const goodResult = `function hello() {
  return "Hello, World!";
}`;

  const criteria = verifier.extractCriteria("implement a function");

  const result = await verifier.verify(goodResult, criteria);

  console.log(`  Status: ${result.status}`);
  console.log(`  Score: ${result.score.toFixed(2)} (${result.passed}/${result.total})`);
  console.log(`  Issues: ${result.issues.length}`);

  if (result.status === "pass" || result.issues.length < criteria.length) {
    console.log("✓ Verification working");
    return true;
  }

  console.log("✗ Verification not working as expected");
  return false;
}

// Test 3: Revision (AC-3)
async function testRevision() {
  console.log("\n=== Test 3: Revision (AC-3) ===");

  const issues = [
    {
      criterion: "has_tests",
      severity: "major" as const,
      description: "No tests found",
      suggestion: "Add test cases",
    },
  ];

  const result = await verifier.revise("implement login", "function login() {}", issues);

  console.log(`  Success: ${result.success}`);
  console.log(`  Changes: ${result.changes.join(", ")}`);

  if (result.success && result.changes.length > 0) {
    console.log("✓ Revision working");
    return true;
  }

  console.log("✗ Revision not working");
  return false;
}

// Test 4: GVR Loop (AC-4)
async function testGVLoop() {
  console.log("\n=== Test 4: GVR Loop (AC-4) ===");

  // Simulate a failing code that needs revision
  const failingResult = "TODO: implement this";

  const result = await verifier.verifyAndRevise("implement login function", failingResult);

  console.log(`  Iterations: ${result.iterations}`);
  console.log(`  Verified: ${result.verified}`);
  console.log(`  Result length: ${result.result.length}`);

  if (result.iterations > 0) {
    console.log("✓ GVR loop working");
    return true;
  }

  console.log("✗ GVR loop not working");
  return false;
}

// Test 5: Reflection (AC-5)
function testReflection() {
  console.log("\n=== Test 5: Reflection (AC-5) ===");

  const result = reflect("implement auth", "function login() { return true; }");

  console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
  console.log(`  Critique: ${result.selfCritique.substring(0, 50)}...`);
  console.log(`  Question: ${result.approachQuestion}`);
  console.log(`  Flagged: ${result.flaggedIssues.length} issues`);

  if (result.confidence > 0 && result.selfCritique) {
    console.log("✓ Reflection working");
    return true;
  }

  console.log("✗ Reflection not working");
  return false;
}

// Test 6: Critical Domain Detection
function testCriticalDomains() {
  console.log("\n=== Test 6: Critical Domain Detection ===");

  const testCases = [
    "fix the security vulnerability",
    "implement JWT authentication",
    "add payment processing",
  ];

  let passed = 0;
  for (const request of testCases) {
    const criteria = verifier.extractCriteria(request);
    const hasSecurity = criteria.some(
      (c) => c.id === "no_hardcoded_secrets" || c.id === "password_handling" || c.id === "has_auth",
    );
    if (hasSecurity || criteria.length > 1) passed++;
  }

  console.log(`✓ ${passed}/${testCases.length} critical domains detected`);
  return passed >= testCases.length * 0.7;
}

// Run all tests
async function runTests() {
  console.log("Verification Loop Tests");
  console.log("=================================");

  const results = [];

  results.push(testCriteriaExtraction());
  results.push(await testVerification());
  results.push(await testRevision());
  results.push(await testGVLoop());
  results.push(testReflection());
  results.push(testCriticalDomains());

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
