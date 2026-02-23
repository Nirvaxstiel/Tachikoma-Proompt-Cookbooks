import { logger } from "../../utils/logger";
import { PositionAwareContext } from "./context-manager";
import { ModelHarness } from "./model-harness";
import { RLMHandler } from "./rlm-handler";
import { CostAwareRouter } from "./router";
import { VerificationLoop } from "./verifier";

export class GeneralPurposeAgent {
  private router: CostAwareRouter;
  private verifier: VerificationLoop;
  private contextManager: PositionAwareContext;
  private modelHarness: ModelHarness;
  private rlmHandler: RLMHandler;

  constructor() {
    this.router = new CostAwareRouter();
    this.verifier = new VerificationLoop();
    this.contextManager = new PositionAwareContext();
    this.modelHarness = new ModelHarness();
    this.rlmHandler = new RLMHandler();
  }

  async handleRequest(request: string, context: unknown): Promise<string> {
    try {
      // Step 1: Classify intent and complexity
      const classification = await this.router.classifyIntent(request);
      const complexity = classification.complexity;
      const strategy = await this.router.selectStrategy(complexity, 0);

      // Step 2: Load appropriate context with position awareness
      const contextData = await this.contextManager.loadContext({
        cwd: process.cwd(),
        injectedContext: context as string,
      });

      // Step 3: Select optimal model and edit format
      const selection = await this.modelHarness.selectModelAndFormat(request);
      const model = selection.model;
      const editFormat = selection.format;

      // Step 4: Execute with verification
      let result: string;

      switch (strategy) {
        case "direct":
          result = await this.executeDirect(request, model, editFormat);
          break;
        case "single_skill":
          result = await this.executeWithSkill(request, model, editFormat);
          break;
        case "skill_chain":
          result = await this.executeSkillChain(request, model, editFormat);
          break;
        case "rlm":
          result = await this.executeWithRLM(request, contextData.optimized, model, editFormat);
          break;
        default:
          throw new Error(`Unknown strategy: ${strategy}`);
      }

      // Step 5: Verify and revise
      const verificationResult = await this.verifier.verifyAndRevise(request, result);
      result = verificationResult.result;

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Agent error:", message);
      return `Error processing request: ${message}`;
    }
  }

  private async executeDirect(request: string, model: string, editFormat: string): Promise<string> {
    // Direct response for simple tasks
    return `Direct response using ${model} with ${editFormat} format`;
  }

  private async executeWithSkill(
    request: string,
    model: string,
    editFormat: string,
  ): Promise<string> {
    // Single skill execution - delegated to OpenCode's skill tool
    return `Use OpenCode's skill tool to load appropriate skill for: ${request}`;
  }

  private async executeSkillChain(
    request: string,
    model: string,
    editFormat: string,
  ): Promise<string> {
    // Multi-skill chain execution
    return `Use OpenCode's skill tool to chain skills for: ${request}`;
  }

  private async executeWithRLM(
    request: string,
    contextData: unknown,
    model: string,
    editFormat: string,
  ): Promise<string> {
    // RLM orchestration for large contexts
    const rlmResult = await this.rlmHandler.processLargeContext(request, contextData as string, {
      model,
    });
    return rlmResult.response;
  }
}

// Export singleton instance
export const agent = new GeneralPurposeAgent();
