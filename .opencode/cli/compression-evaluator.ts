#!/usr/bin/env bun
/**
 * Context Compression Evaluation
 * 
 * This module provides utilities for evaluating context compression quality
 * using probe-based assessment.
 * 
 * PRODUCTION NOTES:
 * - The LLM judge calls are stubbed for demonstration. Production systems
 *   should implement actual API calls to GPT-5.2 or equivalent.
 * - Token estimation uses simplified heuristics. Production systems should
 *   use model-specific tokenizers.
 * - Ground truth extraction uses pattern matching. Production systems may
 *   benefit from more sophisticated fact extraction.
 * 
 * Converted from: .opencode/agents/tachikoma/scripts/context/compression_evaluator.py
 */

import { colors, printHeader } from './lib/colors';

// =============================================================================
// TYPES
// =============================================================================

enum ProbeType {
  RECALL = "recall",
  ARTIFACT = "artifact",
  CONTINUATION = "continuation",
  DECISION = "decision"
}

interface Probe {
  probe_type: ProbeType;
  question: string;
  ground_truth?: string;
  context_reference?: string;
}

interface CriterionConfig {
  id: string;
  question: string;
  weight: number;
}

interface CriterionResult {
  criterion_id: string;
  score: number;
  reasoning: string;
}

interface EvaluationResult {
  probe: Probe;
  response: string;
  criterion_results: CriterionResult[];
  aggregate_score: number;
  dimension_scores: Record<string, number>;
}

interface FileOperation {
  path: string;
  operation: string;
  change?: string;
}

interface Decision {
  decision: string;
  context: string;
}

interface ExtractedInfo {
  intent: string;
  files_modified: FileOperation[];
  files_read: string[];
  decisions: string[];
  current_state: string;
  next_steps: string[];
}

interface EvaluationSummary {
  total_evaluations: number;
  average_score: number;
  dimension_averages: Record<string, number>;
  weakest_dimension: string;
  strongest_dimension: string;
  recommendations?: string[];
  error?: string;
}

// =============================================================================
// EVALUATION RUBRICS
// =============================================================================

const RUBRIC_CRITERIA: Record<string, CriterionConfig[]> = {
  accuracy: [
    {
      id: "accuracy_factual",
      question: "Are facts, file paths, and technical details correct?",
      weight: 0.6,
    },
    {
      id: "accuracy_technical",
      question: "Are code references and technical concepts correct?",
      weight: 0.4,
    },
  ],
  context_awareness: [
    {
      id: "context_conversation_state",
      question: "Does the response reflect current conversation state?",
      weight: 0.5,
    },
    {
      id: "context_artifact_state",
      question: "Does the response reflect which files/artifacts were accessed?",
      weight: 0.5,
    },
  ],
  artifact_trail: [
    {
      id: "artifact_files_created",
      question: "Does the agent know which files were created?",
      weight: 0.3,
    },
    {
      id: "artifact_files_modified",
      question: "Does the agent know which files were modified?",
      weight: 0.4,
    },
    {
      id: "artifact_key_details",
      question: "Does the agent remember function names, variable names, error messages?",
      weight: 0.3,
    },
  ],
  completeness: [
    {
      id: "completeness_coverage",
      question: "Does the response address all parts of the question?",
      weight: 0.6,
    },
    {
      id: "completeness_depth",
      question: "Is sufficient detail provided?",
      weight: 0.4,
    },
  ],
  continuity: [
    {
      id: "continuity_work_state",
      question: "Can the agent continue without re-fetching information?",
      weight: 0.4,
    },
    {
      id: "continuity_todo_state",
      question: "Does the agent maintain awareness of pending tasks?",
      weight: 0.3,
    },
    {
      id: "continuity_reasoning",
      question: "Does the agent retain rationale behind previous decisions?",
      weight: 0.3,
    },
  ],
  instruction_following: [
    {
      id: "instruction_format",
      question: "Does the response follow the requested format?",
      weight: 0.5,
    },
    {
      id: "instruction_constraints",
      question: "Does the response respect stated constraints?",
      weight: 0.5,
    },
  ],
};

// =============================================================================
// PROBE GENERATOR
// =============================================================================

class ProbeGenerator {
  private history: string;
  private extractedFacts: Record<string, string>;
  private extractedFiles: FileOperation[];
  private extractedDecisions: Decision[];

  constructor(conversationHistory: string) {
    this.history = conversationHistory;
    this.extractedFacts = this.extractFacts();
    this.extractedFiles = this.extractFiles();
    this.extractedDecisions = this.extractDecisions();
  }

  generateProbes(): Probe[] {
    const probes: Probe[] = [];

    // Recall probes
    if (Object.keys(this.extractedFacts).length > 0) {
      probes.push({
        probe_type: ProbeType.RECALL,
        question: "What was the original error or issue that started this session?",
        ground_truth: this.extractedFacts["original_error"],
        context_reference: "session_start",
      });
    }

    // Artifact probes
    if (this.extractedFiles.length > 0) {
      probes.push({
        probe_type: ProbeType.ARTIFACT,
        question: "Which files have we modified? Describe what changed in each.",
        ground_truth: JSON.stringify(this.extractedFiles),
        context_reference: "file_operations",
      });
    }

    // Continuation probes
    probes.push({
      probe_type: ProbeType.CONTINUATION,
      question: "What should we do next?",
      ground_truth: this.extractedFacts["next_steps"],
      context_reference: "task_state",
    });

    // Decision probes
    if (this.extractedDecisions.length > 0) {
      probes.push({
        probe_type: ProbeType.DECISION,
        question: "What key decisions did we make and why?",
        ground_truth: JSON.stringify(this.extractedDecisions),
        context_reference: "decision_points",
      });
    }

    return probes;
  }

  private extractFacts(): Record<string, string> {
    const facts: Record<string, string> = {};

    // Extract error patterns
    const errorPatterns = [
      /error[:\s]+(.+?)(?:\n|$)/i,
      /(\d{3})\s+(Unauthorized|Not Found|Internal Server Error)/i,
      /exception[:\s]+(.+?)(?:\n|$)/i,
    ];

    for (const pattern of errorPatterns) {
      const match = this.history.match(pattern);
      if (match) {
        facts["original_error"] = match[0].trim();
        break;
      }
    }

    // Extract next steps
    const nextStepPatterns = [
      /next[:\s]+(.+?)(?:\n|$)/i,
      /TODO[:\s]+(.+?)(?:\n|$)/i,
      /remaining[:\s]+(.+?)(?:\n|$)/i,
    ];

    for (const pattern of nextStepPatterns) {
      const match = this.history.match(pattern);
      if (match) {
        facts["next_steps"] = match[0].trim();
        break;
      }
    }

    return facts;
  }

  private extractFiles(): FileOperation[] {
    const files: FileOperation[] = [];

    // Common file patterns
    const filePatterns = [
      { regex: /(?:modified|changed|updated|edited)\s+([^\s]+\.[a-z]+)/gi, op: "modified" },
      { regex: /(?:created|added)\s+([^\s]+\.[a-z]+)/gi, op: "created" },
      { regex: /(?:read|examined|opened)\s+([^\s]+\.[a-z]+)/gi, op: "read" },
    ];

    for (const { regex, op } of filePatterns) {
      let match;
      while ((match = regex.exec(this.history)) !== null) {
        const path = match[1];
        if (!files.some(f => f.path === path)) {
          files.push({ path, operation: op });
        }
      }
    }

    return files;
  }

  private extractDecisions(): Decision[] {
    const decisions: Decision[] = [];

    const decisionPatterns = [
      /decided to\s+(.+?)(?:\n|$)/gi,
      /chose\s+(.+?)(?:\n|$)/gi,
      /going with\s+(.+?)(?:\n|$)/gi,
      /will use\s+(.+?)(?:\n|$)/gi,
    ];

    for (const pattern of decisionPatterns) {
      let match;
      while ((match = pattern.exec(this.history)) !== null) {
        decisions.push({
          decision: match[1].trim(),
          context: pattern.source.split("\\s+")[0],
        });
      }
    }

    return decisions.slice(0, 5); // Limit to 5 decisions
  }
}

// =============================================================================
// COMPRESSION EVALUATOR
// =============================================================================

class CompressionEvaluator {
  private model: string;
  private results: EvaluationResult[];

  constructor(model: string = "gpt-5.2") {
    this.model = model;
    this.results = [];
  }

  evaluate(probe: Probe, response: string, compressedContext: string): EvaluationResult {
    // Get relevant criteria based on probe type
    const criteria = this.getCriteriaForProbe(probe.probe_type);

    // Evaluate each criterion
    const criterionResults: CriterionResult[] = [];
    for (const criterion of criteria) {
      const result = this.evaluateCriterion(criterion, probe, response, compressedContext);
      criterionResults.push(result);
    }

    // Calculate dimension scores
    const dimensionScores = this.calculateDimensionScores(criterionResults);

    // Calculate aggregate score
    const aggregateScore = Object.values(dimensionScores).reduce((a, b) => a + b, 0) / 
                          Object.values(dimensionScores).length;

    const result: EvaluationResult = {
      probe,
      response,
      criterion_results: criterionResults,
      aggregate_score: aggregateScore,
      dimension_scores: dimensionScores,
    };

    this.results.push(result);
    return result;
  }

  private getCriteriaForProbe(probeType: ProbeType): CriterionConfig[] {
    const criteria: CriterionConfig[] = [];

    // All probes get accuracy and completeness
    criteria.push(...RUBRIC_CRITERIA.accuracy);
    criteria.push(...RUBRIC_CRITERIA.completeness);

    // Add type-specific criteria
    switch (probeType) {
      case ProbeType.ARTIFACT:
        criteria.push(...RUBRIC_CRITERIA.artifact_trail);
        break;
      case ProbeType.CONTINUATION:
        criteria.push(...RUBRIC_CRITERIA.continuity);
        break;
      case ProbeType.RECALL:
      case ProbeType.DECISION:
        criteria.push(...RUBRIC_CRITERIA.context_awareness);
        criteria.push(...RUBRIC_CRITERIA.continuity);
        break;
    }

    criteria.push(...RUBRIC_CRITERIA.instruction_following);

    return criteria;
  }

  private evaluateCriterion(
    criterion: CriterionConfig,
    probe: Probe,
    response: string,
    _context: string
  ): CriterionResult {
    /**
     * Evaluate a single criterion using LLM judge.
     * 
     * PRODUCTION NOTE: This is a stub implementation.
     * Production systems should call the actual LLM API.
     */
    const score = this.heuristicScore(criterion, response, probe.ground_truth);
    const reasoning = `Evaluated ${criterion.id} based on response content.`;

    return {
      criterion_id: criterion.id,
      score,
      reasoning,
    };
  }

  private heuristicScore(
    criterion: CriterionConfig,
    response: string,
    groundTruth?: string
  ): number {
    /**
     * Heuristic scoring for demonstration.
     * Production systems should use LLM judge instead.
     */
    let score = 3.0; // Base score

    // Adjust based on response length and content
    if (response.length < 50) {
      score -= 1.0; // Too short
    } else if (response.length > 500) {
      score += 0.5; // Detailed
    }

    // Check for technical content
    if ([".ts", ".py", ".js", ".md"].some(ext => response.includes(ext))) {
      score += 0.5; // Contains file references
    }

    if (groundTruth && response.includes(groundTruth)) {
      score += 1.0; // Contains ground truth
    }

    return Math.min(5.0, Math.max(0.0, score));
  }

  private calculateDimensionScores(criterionResults: CriterionResult[]): Record<string, number> {
    const dimensionScores: Record<string, number> = {};

    for (const [dimension, criteria] of Object.entries(RUBRIC_CRITERIA)) {
      const criterionIds = criteria.map(c => c.id);
      const relevantResults = criterionResults.filter(r => criterionIds.includes(r.criterion_id));

      if (relevantResults.length > 0) {
        // Weighted average
        let totalWeight = 0;
        let weightedSum = 0;

        for (const result of relevantResults) {
          const criterionConfig = criteria.find(c => c.id === result.criterion_id);
          if (criterionConfig) {
            totalWeight += criterionConfig.weight;
            weightedSum += result.score * criterionConfig.weight;
          }
        }

        dimensionScores[dimension] = totalWeight > 0 ? weightedSum / totalWeight : 0.0;
      }
    }

    return dimensionScores;
  }

  getSummary(): EvaluationSummary {
    if (this.results.length === 0) {
      return { error: "No evaluations performed" } as EvaluationSummary;
    }

    const avgScore = this.results.reduce((sum, r) => sum + r.aggregate_score, 0) / this.results.length;

    // Average dimension scores
    const dimensionTotals: Record<string, number> = {};
    const dimensionCounts: Record<string, number> = {};

    for (const result of this.results) {
      for (const [dim, score] of Object.entries(result.dimension_scores)) {
        dimensionTotals[dim] = (dimensionTotals[dim] || 0) + score;
        dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
      }
    }

    const avgDimensions: Record<string, number> = {};
    for (const dim of Object.keys(dimensionTotals)) {
      avgDimensions[dim] = dimensionTotals[dim] / dimensionCounts[dim];
    }

    const entries = Object.entries(avgDimensions);
    const weakest = entries.reduce((a, b) => a[1] < b[1] ? a : b)[0];
    const strongest = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      total_evaluations: this.results.length,
      average_score: avgScore,
      dimension_averages: avgDimensions,
      weakest_dimension: weakest,
      strongest_dimension: strongest,
    };
  }
}

// =============================================================================
// STRUCTURED SUMMARIZER
// =============================================================================

class StructuredSummarizer {
  private static TEMPLATE = `## Session Intent
{intent}

## Files Modified
{files_modified}

## Files Read (Not Modified)
{files_read}

## Decisions Made
{decisions}

## Current State
{current_state}

## Next Steps
{next_steps}
`;

  private sections: ExtractedInfo = {
    intent: "",
    files_modified: [],
    files_read: [],
    decisions: [],
    current_state: "",
    next_steps: [],
  };

  updateFromSpan(newContent: string): string {
    /**
     * Update summary from newly truncated content span.
     * 
     * This implements anchored iterative summarization:
     * - Extract information from new span
     * - Merge with existing sections
     * - Return updated summary
     */
    const newInfo = this.extractFromContent(newContent);
    this.mergeSections(newInfo);
    return this.formatSummary();
  }

  private extractFromContent(content: string): ExtractedInfo {
    const extracted: ExtractedInfo = {
      intent: "",
      files_modified: [],
      files_read: [],
      decisions: [],
      current_state: "",
      next_steps: [],
    };

    // Extract file modifications
    const modPattern = /(?:modified|changed|updated|fixed)\s+([^\s]+\.[a-z]+)[:\s]*(.+?)(?:\n|$)/gi;
    let match;
    while ((match = modPattern.exec(content)) !== null) {
      extracted.files_modified.push({
        path: match[1],
        operation: "modified",
        change: match[2].trim().slice(0, 100),
      });
    }

    // Extract file reads
    const readPattern = /(?:read|examined|opened|checked)\s+([^\s]+\.[a-z]+)/gi;
    while ((match = readPattern.exec(content)) !== null) {
      const filePath = match[1];
      if (!extracted.files_modified.some(f => f.path === filePath)) {
        extracted.files_read.push(filePath);
      }
    }

    // Extract decisions
    const decisionPattern = /(?:decided|chose|going with|will use)\s+(.+?)(?:\n|$)/gi;
    while ((match = decisionPattern.exec(content)) !== null) {
      extracted.decisions.push(match[1].trim().slice(0, 150));
    }

    return extracted;
  }

  private mergeSections(newInfo: ExtractedInfo): void {
    // Update intent if empty
    if (newInfo.intent && !this.sections.intent) {
      this.sections.intent = newInfo.intent;
    }

    // Merge file lists (deduplicate by path)
    const existingModPaths = this.sections.files_modified.map(f => f.path);
    for (const fileInfo of newInfo.files_modified) {
      if (!existingModPaths.includes(fileInfo.path)) {
        this.sections.files_modified.push(fileInfo);
      }
    }

    // Merge read files
    for (const filePath of newInfo.files_read) {
      if (!this.sections.files_read.includes(filePath)) {
        this.sections.files_read.push(filePath);
      }
    }

    // Append decisions
    this.sections.decisions.push(...newInfo.decisions);

    // Update current state (latest wins)
    if (newInfo.current_state) {
      this.sections.current_state = newInfo.current_state;
    }

    // Merge next steps
    this.sections.next_steps.push(...newInfo.next_steps);
  }

  private formatSummary(): string {
    const filesModifiedStr = this.sections.files_modified.length > 0
      ? this.sections.files_modified.map(f => `- ${f.path}: ${f.change || ''}`).join('\n')
      : 'None';

    const filesReadStr = this.sections.files_read.length > 0
      ? this.sections.files_read.map(f => `- ${f}`).join('\n')
      : 'None';

    const decisionsStr = this.sections.decisions.length > 0
      ? this.sections.decisions.slice(-5).map(d => `- ${d}`).join('\n')
      : 'None';

    const nextStepsStr = this.sections.next_steps.length > 0
      ? this.sections.next_steps.slice(-5).map((s, i) => `${i + 1}. ${s}`).join('\n')
      : 'None';

    return StructuredSummarizer.TEMPLATE
      .replace('{intent}', this.sections.intent || 'Not specified')
      .replace('{files_modified}', filesModifiedStr)
      .replace('{files_read}', filesReadStr)
      .replace('{decisions}', decisionsStr)
      .replace('{current_state}', this.sections.current_state || 'In progress')
      .replace('{next_steps}', nextStepsStr);
  }
}

// =============================================================================
// CLI
// =============================================================================

function printUsage(): void {
  printHeader('Compression Evaluator');
  console.log();
  console.log(`${colors.yellow}Usage:${colors.reset}`);
  console.log(`  bun run compression-evaluator.ts <command> [args]`);
  console.log();
  console.log(`${colors.yellow}Commands:${colors.reset}`);
  console.log(`  ${colors.green}probes <file>${colors.reset}         Generate probes from conversation file`);
  console.log(`  ${colors.green}rubric${colors.reset}                Show evaluation rubric`);
  console.log(`  ${colors.green}demo${colors.reset}                  Run demo evaluation`);
  console.log();
  console.log(`${colors.yellow}Library Usage:${colors.reset}`);
  console.log(`  import { ProbeGenerator, CompressionEvaluator } from './compression-evaluator';`);
}

function showRubric(): void {
  printHeader('Evaluation Rubric');
  console.log();

  for (const [dimension, criteria] of Object.entries(RUBRIC_CRITERIA)) {
    console.log(`${colors.cyan}${dimension.toUpperCase()}${colors.reset}`);
    for (const c of criteria) {
      console.log(`  ${colors.yellow}${c.id}${colors.reset} (weight: ${c.weight})`);
      console.log(`    ${c.question}`);
    }
    console.log();
  }
}

function runDemo(): void {
  printHeader('Demo: Compression Evaluation');
  console.log();

  const sampleHistory = `
User: Help me fix the auth bug in auth.ts
Agent: I found the issue. The token validation is failing because the secret is wrong.
Agent: I modified auth.ts: changed the secret validation logic.
Agent: Decided to use environment variables for the secret instead of hardcoding.
User: What's next?
Agent: Next: test the fix and update the unit tests.
  `.trim();

  console.log(`${colors.cyan}Sample Conversation:${colors.reset}`);
  console.log(sampleHistory);
  console.log();

  // Generate probes
  const generator = new ProbeGenerator(sampleHistory);
  const probes = generator.generateProbes();

  console.log(`${colors.cyan}Generated Probes:${colors.reset}`);
  for (const probe of probes) {
    console.log(`  ${colors.yellow}[${probe.probe_type}]${colors.reset} ${probe.question}`);
    if (probe.ground_truth) {
      console.log(`    Ground truth: ${probe.ground_truth.slice(0, 50)}...`);
    }
  }
  console.log();

  // Evaluate
  const evaluator = new CompressionEvaluator();
  const sampleResponse = "The original issue was with the auth token validation. We modified auth.ts to fix the secret handling. Next we should test the fix.";

  console.log(`${colors.cyan}Evaluating Sample Response:${colors.reset}`);
  console.log(`  "${sampleResponse}"`);
  console.log();

  for (const probe of probes.slice(0, 2)) {
    evaluator.evaluate(probe, sampleResponse, "compressed context");
  }

  const summary = evaluator.getSummary();
  console.log(`${colors.cyan}Evaluation Summary:${colors.reset}`);
  console.log(`  Total evaluations: ${summary.total_evaluations}`);
  console.log(`  Average score: ${summary.average_score.toFixed(2)}`);
  console.log(`  Strongest dimension: ${summary.strongest_dimension}`);
  console.log(`  Weakest dimension: ${summary.weakest_dimension}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'rubric':
      showRubric();
      break;

    case 'demo':
      runDemo();
      break;

    case 'probes':
      if (args.length < 2) {
        console.error(`${colors.red}Error: probes requires <file>${colors.reset}`);
        process.exit(1);
      }
      const filePath = args[1];
      try {
        const content = await Bun.file(filePath).text();
        const gen = new ProbeGenerator(content);
        const probeList = gen.generateProbes();
        console.log(JSON.stringify(probeList, null, 2));
      } catch (err) {
        console.error(`${colors.red}Error reading file:${colors.reset}`, err);
        process.exit(1);
      }
      break;

    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      printUsage();
      process.exit(1);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ProbeType,
  ProbeGenerator,
  CompressionEvaluator,
  StructuredSummarizer,
  RUBRIC_CRITERIA,
};

export type {
  Probe,
  CriterionResult,
  EvaluationResult,
  EvaluationSummary,
};

// Run CLI if executed directly
main().catch(err => {
  console.error(`${colors.red}Error:${colors.reset}`, err.message);
  process.exit(1);
});
