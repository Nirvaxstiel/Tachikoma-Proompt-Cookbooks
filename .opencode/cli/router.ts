#!/usr/bin/env bun
/**
 * Tachikoma CLI Router - TypeScript version
 * 
 * Fast intent classification and routing using keyword matching.
 * Converted from cli-router.py
 * 
 * Usage:
 *   bun run router.ts classify "fix the bug"
 *   bun run router.ts route debug
 *   bun run router.ts full "fix the bug in auth" --json
 */

import { parseArgs } from 'node:util';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { colors, printHeader, printSuccess, printError, printWarning, printStep } from './lib/colors';
import type { RoutesConfig, ClassificationResult, IntentRoute } from './lib/types';

// =============================================================================
// PATHS
// =============================================================================

// Get the .opencode directory (parent of cli/)
const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, '..');
const CONTEXT_DIR = `${OPENCODE_DIR}/context-modules`;
const CONFIG_DIR = `${OPENCODE_DIR}/agents/tachikoma/config`;
const ROUTING_DIR = `${CONFIG_DIR}/routing`;

// =============================================================================
// YAML LOADING (cached)
// =============================================================================

let _intentsCache: any = null;
let _skillsCache: any = null;

function loadIntentsConfig(): any {
  if (_intentsCache) return _intentsCache;
  
  const intentsFile = `${ROUTING_DIR}/intents.yaml`;
  
  try {
    const content = require('fs').readFileSync(intentsFile, 'utf-8');
    // Handle multi-document YAML (documents separated by ---)
    const docs = yaml.loadAll(content);
    // Merge all documents into one object
    const merged: any = {};
    for (const doc of docs) {
      if (doc && typeof doc === 'object') {
        Object.assign(merged, doc);
      }
    }
    _intentsCache = merged;
    return _intentsCache;
  } catch (e) {
    const error = e as Error;
    printError(`Error loading intents config: ${error.message}`);
    return { intents: {} };
  }
}

function loadSkillsConfig(): any {
  if (_skillsCache) return _skillsCache;
  
  const skillsFile = `${ROUTING_DIR}/skills.yaml`;
  
  try {
    const content = require('fs').readFileSync(skillsFile, 'utf-8');
    const config = yaml.load(content);
    _skillsCache = config;
    return config;
  } catch (e) {
    const error = e as Error;
    printError(`Error loading skills config: ${error.message}`);
    return {};
  }
}

function loadRoutes(): RoutesConfig {
  const intentsConfig = loadIntentsConfig();
  
  // Convert new format to legacy format for compatibility
  const routes: Record<string, any> = {};
  const keywords: Record<string, string[]> = {};
  
  if (intentsConfig.intents) {
    for (const [name, intent] of Object.entries(intentsConfig.intents)) {
      const i = intent as any;
      routes[name] = {
        description: i.description || '',
        confidence_threshold: i.confidence_threshold || 0.5,
        context_modules: i.context_modules || [],
        skill: i.skill || 'code-agent',
      };
      keywords[name] = i.keywords || [];
    }
  }
  
  return { routes, keywords };
}

function loadIntentKeywords(): Record<string, string[]> {
  const intentsConfig = loadIntentsConfig();
  const keywords: Record<string, string[]> = {};
  
  if (intentsConfig.intents) {
    for (const [name, intent] of Object.entries(intentsConfig.intents)) {
      keywords[name] = (intent as any).keywords || [];
    }
  }
  
  return keywords;
}

// =============================================================================
// INTENT CLASSIFICATION
// =============================================================================

interface ClassifyResult {
  intent: string;
  confidence: number;
  reasoning: string;
  suggested_action: string;
  keywords_matched: string[];
  alternative_intents: Array<{ intent: string; score: number }>;
  workflow: { needed: boolean; name?: string };
  skills_bulk: { needed: boolean; name?: string };
  complexity: number;
}

function classifyIntent(query: string): ClassifyResult {
  const queryLower = query.toLowerCase().trim();
  const keywordsMap = loadIntentKeywords();
  
  if (Object.keys(keywordsMap).length === 0) {
    return {
      intent: 'unclear',
      confidence: 0.3,
      reasoning: 'No intent keywords configured',
      suggested_action: 'llm',
      keywords_matched: [],
      alternative_intents: [],
      workflow: { needed: false },
      skills_bulk: { needed: false },
      complexity: 0.0,
    };
  }
  
  // Score each intent based on keyword matches
  const scores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};
  
  for (const [intent, keywords] of Object.entries(keywordsMap)) {
    const matches: string[] = [];
    
    for (const keyword of keywords) {
      // Use word boundary matching for accuracy
      const pattern = new RegExp(`\\b${escapeRegex(keyword.toLowerCase())}\\b`);
      if (pattern.test(queryLower)) {
        matches.push(keyword);
      }
    }
    
    if (matches.length > 0) {
      scores[intent] = matches.length;
      matchedKeywords[intent] = matches;
    }
  }
  
  if (Object.keys(scores).length === 0) {
    return {
      intent: 'unclear',
      confidence: 0.3,
      reasoning: 'No keyword matches found',
      suggested_action: 'llm',
      keywords_matched: [],
      alternative_intents: [],
      workflow: { needed: false },
      skills_bulk: { needed: false },
      complexity: detectComplexity(query),
    };
  }
  
  // Sort by score
  const sortedIntents = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
  
  const primaryIntent = sortedIntents[0][0];
  const primaryScore = sortedIntents[0][1];
  
  // Calculate confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let confidence = Math.min(primaryScore / Math.max(totalScore, 1), 1.0);
  
  // Boost confidence if primary is significantly higher
  if (sortedIntents.length > 1) {
    const ratio = primaryScore / Math.max(sortedIntents[1][1], 1);
    if (ratio > 2) {
      confidence = Math.min(confidence * 1.2, 1.0);
    }
  }
  
  // Determine action based on confidence
  let action: string;
  if (confidence >= 0.7) {
    action = 'skill';
  } else if (confidence >= 0.5) {
    action = 'llm';
  } else {
    action = 'llm';
  }
  
  // Detect workflow/skills_bulk need
  const workflow = detectWorkflowNeed(query);
  const skillsBulk = detectSkillsBulkNeed(query);
  
  if (workflow.needed) {
    action = 'workflow';
  } else if (skillsBulk.needed) {
    action = 'skills_bulk';
  }
  
  const complexity = detectComplexity(query);
  
  return {
    intent: primaryIntent,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `Matched keywords: ${matchedKeywords[primaryIntent]?.join(', ') || 'none'}`,
    suggested_action: action,
    keywords_matched: matchedKeywords[primaryIntent] || [],
    alternative_intents: sortedIntents.slice(1, 3).map(([intent, score]) => ({ intent, score })),
    workflow,
    skills_bulk: skillsBulk,
    complexity: Math.round(complexity * 100) / 100,
  };
}

function detectComplexity(query: string): number {
  let complexity = 0.0;
  
  const words = query.split(/\s+/);
  if (words.length > 10) complexity += 0.2;
  if (words.length > 20) complexity += 0.1;
  
  const multiStepPatterns = [
    /\band\b/i,
    /\bthen\b/i,
    /\bafter\b/i,
    /\bbefore\b/i,
    /\bfirst\b/i,
    /\bnext\b/i,
    /\bfinally\b/i,
  ];
  
  for (const pattern of multiStepPatterns) {
    if (pattern.test(query)) complexity += 0.15;
  }
  
  // High-stakes keywords
  if (/\b(secure|safe|critical|production|auth|payment)\b/i.test(query)) {
    complexity += 0.2;
  }
  
  return Math.min(complexity, 1.0);
}

function detectWorkflowNeed(query: string): { needed: boolean; name?: string } {
  const workflowPatterns: Array<[RegExp, string]> = [
    [/research.*implement/i, 'research-implement'],
    [/implement.*verify/i, 'implement-verify'],
    [/implement.*test/i, 'implement-verify'],
    [/security.*implement/i, 'security-implement'],
    [/review.*reflect/i, 'deep-review'],
    [/add.*authentication/i, 'complex-workflow'],
    [/add.*oauth/i, 'complex-workflow'],
    [/implement\s+system/i, 'complex-workflow'],
    [/build\s+feature/i, 'complex-workflow'],
    [/create\s+new\s+feature/i, 'complex-workflow'],
    [/quality\s+checks/i, 'complex-workflow'],
    [/production-grade/i, 'complex-workflow'],
    [/with\s+validation/i, 'complex-workflow'],
    [/step\s+by\s+step/i, 'complex-workflow'],
  ];
  
  for (const [pattern, name] of workflowPatterns) {
    if (pattern.test(query)) {
      return { needed: true, name };
    }
  }
  
  return { needed: false };
}

function detectSkillsBulkNeed(query: string): { needed: boolean; name?: string } {
  const bulkIndicators = [
    'thoroughly',
    'comprehensive',
    'full analysis',
    'multiple',
    'all angles',
    'deep dive',
  ];
  
  const queryLower = query.toLowerCase();
  for (const indicator of bulkIndicators) {
    if (queryLower.includes(indicator)) {
      return { needed: true, name: 'full-stack' };
    }
  }
  
  return { needed: false };
}

// =============================================================================
// ROUTE LOOKUP
// =============================================================================

function getRoute(intent: string): IntentRoute | null {
  const routes = loadRoutes();
  return routes.routes?.[intent] || null;
}

function getWorkflow(workflowName: string): any {
  const routes = loadRoutes() as any;
  return routes.workflows?.[workflowName] || null;
}

// =============================================================================
// UTILITY
// =============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// CLI COMMANDS
// =============================================================================

function cmdClassify(query: string): number {
  if (!query) {
    printError('Query required');
    console.log('Usage: bun run router.ts classify "fix the bug in auth"');
    return 1;
  }
  
  const result = classifyIntent(query);
  
  printHeader(`INTENT CLASSIFICATION: "${query}"`);
  console.log();
  
  const { intent, confidence, suggested_action: action, complexity, keywords_matched: keywords } = result;
  
  // Color-code confidence
  let confColor: string;
  if (confidence >= 0.8) {
    confColor = colors.green;
  } else if (confidence >= 0.5) {
    confColor = colors.yellow;
  } else {
    confColor = colors.red;
  }
  
  console.log(`  Intent:        ${colors.cyan}${intent}${colors.reset}`);
  console.log(`  Confidence:    ${confColor}${(confidence * 100).toFixed(0)}%${colors.reset}`);
  console.log(`  Action:        ${action}`);
  console.log(`  Complexity:    ${(complexity * 100).toFixed(0)}%`);
  console.log(`  Keywords:      ${keywords.length > 0 ? keywords.join(', ') : 'none'}`);
  
  if (result.workflow?.needed) {
    console.log(`  Workflow:      ${colors.magenta}${result.workflow.name}${colors.reset}`);
  }
  
  if (result.skills_bulk?.needed) {
    console.log(`  Skills Bulk:   ${colors.magenta}${result.skills_bulk.name}${colors.reset}`);
  }
  
  const altIntents = result.alternative_intents;
  if (altIntents.length > 0) {
    console.log(`  Alternatives:  ${altIntents.map(a => a.intent).join(', ')}`);
  }
  
  console.log();
  return 0;
}

function cmdRoute(intent: string | undefined, list: boolean): number {
  const routes = loadRoutes();
  
  if (list || !intent) {
    printHeader('AVAILABLE ROUTES');
    
    for (const [name, config] of Object.entries(routes.routes || {})) {
      const skill = (config as any).skill || (config as any).subagent || 'none';
      const invoke = config.invoke_via || 'unknown';
      console.log(`  ${colors.cyan}${name.padEnd(15)}${colors.reset} -> ${(skill as string).padEnd(25)} (${invoke})`);
    }
    
    console.log();
    return 0;
  }
  
  const route = getRoute(intent);
  
  printHeader(`ROUTE: ${intent}`);
  console.log();
  
  if (!route) {
    printError(`No route found for intent: ${intent}`);
    console.log('Use --list to see available routes');
    return 1;
  }
  
  const r = route as any;
  console.log(`  Description:   ${r.description || 'N/A'}`);
  console.log(`  Skill:         ${r.skill || r.subagent || 'N/A'}`);
  console.log(`  Invoke via:    ${r.invoke_via || 'N/A'}`);
  console.log(`  Strategy:      ${r.strategy || 'N/A'}`);
  
  const ctxModules = route.context_modules || [];
  if (ctxModules.length > 0) {
    console.log(`  Context:       ${ctxModules.join(', ')}`);
  }
  
  const tools = route.tools || [];
  if (tools.length > 0) {
    console.log(`  Tools:         ${tools.join(', ')}`);
  }
  
  console.log();
  return 0;
}

function cmdFull(query: string, json: boolean): number {
  if (!query) {
    printError('Query required');
    console.log('Usage: bun run router.ts full "fix the bug in auth" --json');
    return 1;
  }
  
  printHeader(`FULL ROUTING: "${query}"`);
  console.log();
  
  // Step 1: Classify intent
  printStep('[1/3]', 'Classifying intent...');
  const classification = classifyIntent(query);
  
  let { intent, confidence } = classification;
  
  printSuccess(`Intent: ${intent} (confidence: ${(confidence * 100).toFixed(0)}%)`);
  console.log();
  
  // Step 2: Get route
  printStep('[2/3]', 'Looking up route...');
  
  let route: IntentRoute | null = null;
  
  // Check if workflow is detected
  if (classification.workflow?.needed) {
    const workflowName = classification.workflow.name || '';
    const wfConfig = getWorkflow(workflowName);
    
    if (wfConfig?.skills?.length > 0) {
      intent = workflowName;
      route = getRoute(workflowName);
      printSuccess(`Detected workflow: ${workflowName}`);
    } else {
      route = getRoute(intent);
    }
  } else {
    route = getRoute(intent);
  }
  
  if (!route) {
    printError(`No route found for intent: ${intent}`);
    const availableIntents = Object.keys(loadRoutes().routes || {});
    console.log(`Available intents: ${availableIntents.join(', ')}`);
    return 1;
  }
  
  const r = route as any;
  const skill = r.skill || r.subagent || 'N/A';
  const invokeVia = r.invoke_via || 'skill';
  
  printSuccess(`Route: ${skill} (via ${invokeVia})`);
  console.log();
  
  // Step 3: Show context modules
  printStep('[3/3]', 'Context modules to load:');
  const ctxModules = route.context_modules || [];
  
  for (const ctx of ctxModules) {
    const ctxPath = `${CONTEXT_DIR}/${ctx}.md`;
    // Use sync file check
    const exists = require('fs').existsSync(ctxPath);
    if (exists) {
      console.log(`  ${colors.green}[+]${colors.reset} ${ctx}`);
    } else {
      console.log(`  ${colors.red}[x]${colors.reset} ${ctx} (NOT FOUND)}`);
    }
  }
  
  console.log();
  printHeader('ROUTING DECISION');
  console.log();
  
  // Final summary
  console.log(`  Query:         ${query}`);
  console.log(`  Intent:        ${colors.cyan}${intent}${colors.reset}`);
  console.log(`  Confidence:    ${(confidence * 100).toFixed(0)}%`);
  console.log(`  Route to:      ${colors.green}${skill}${colors.reset}`);
  console.log(`  Invoke:        ${invokeVia}`);
  console.log(`  Strategy:      ${r.strategy || 'N/A'}`);
  
  if (classification.workflow?.needed) {
    console.log(`  Workflow:      ${colors.magenta}${classification.workflow.name}${colors.reset}`);
  }
  
  if (classification.skills_bulk?.needed) {
    console.log(`  Skills Bulk:   ${colors.magenta}${classification.skills_bulk.name}${colors.reset}`);
  }
  
  const tools = route.tools || [];
  if (tools.length > 0) {
    console.log(`  Tools:         ${tools.join(', ')}`);
  }
  
  console.log();
  
  // Output JSON for programmatic use
  if (json) {
    const output = {
      query,
      intent,
      confidence,
      route: skill,
      invoke_via: invokeVia,
      strategy: r.strategy || null,
      context_modules: ctxModules,
      tools,
      workflow: classification.workflow?.name || '',
      skills_bulk: classification.skills_bulk?.name || '',
    };
    console.log(JSON.stringify(output, null, 2));
  }
  
  return 0;
}

// =============================================================================
// MAIN
// =============================================================================

function printUsage(): void {
  console.log(`
Tachikoma CLI Router - Fast intent classification and routing

Usage:
  bun run router.ts <command> [options]

Commands:
  classify <query>    Classify intent from query
  route [intent]      Show route for intent (or --list for all)
  full <query>        Full routing workflow

Options:
  --json              Output as JSON
  --list              List all available routes

Examples:
  bun run router.ts classify "fix the bug in auth"
  bun run router.ts route debug
  bun run router.ts full "fix the bug in auth" --json
`);
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    return 0;
  }
  
  const command = args[0];
  const restArgs = args.slice(1);
  
  // Parse flags
  const json = restArgs.includes('--json');
  const list = restArgs.includes('--list');
  const queryArgs = restArgs.filter(a => !a.startsWith('--'));
  const query = queryArgs.join(' ');
  
  switch (command) {
    case 'classify':
      return cmdClassify(query);
    case 'route':
      return cmdRoute(queryArgs[0], list);
    case 'full':
      return cmdFull(query, json);
    case 'help':
    case '--help':
    case '-h':
      printUsage();
      return 0;
    default:
      printError(`Unknown command: ${command}`);
      printUsage();
      return 1;
  }
}

// Run
main().then(code => process.exit(code));
