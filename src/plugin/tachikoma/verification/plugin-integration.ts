import { DeepVerifier } from "./deep-verifier";
import { FailureTaxonomyFactory } from "./failure-taxonomy";
import { GVRRubricIntegration } from "./gvr-integration";
import type { VerificationLoop } from "../verifier";
import type { VerificationContext, VerificationOutcome, Rubric } from "./types";

export interface VerificationPluginConfig {
  enableRubricVerification: boolean;
  combineWithGVR: boolean;
  enableTestTimeScaling: boolean;
  maxHistorySize: number;
  confidenceThresholds: Record<string, number>;
}

const DEFAULT_PLUGIN_CONFIG: VerificationPluginConfig = {
  enableRubricVerification: true,
  combineWithGVR: true,
  enableTestTimeScaling: true,
  maxHistorySize: 1000,
  confidenceThresholds: {
    very_low: 0.1,
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    very_high: 0.95,
    critical: 1.0,
  },
};

export class VerificationPlugin {
  private verifier: VerificationLoop;
  private deepVerifier: DeepVerifier;
  private integration: GVRRubricIntegration;
  private config: VerificationPluginConfig;
  private initialized: boolean;

  constructor(
    verifier: VerificationLoop,
    config?: Partial<VerificationPluginConfig>,
  ) {
    this.config = { ...DEFAULT_PLUGIN_CONFIG, ...config };
    this.verifier = verifier;
    this.deepVerifier = new DeepVerifier({
      enableTestTimeScaling: this.config.enableTestTimeScaling,
      maxHistorySize: this.config.maxHistorySize,
      confidenceThresholds: this.config.confidenceThresholds,
    });
    this.integration = new GVRRubricIntegration(
      this.verifier,
      this.deepVerifier,
      {
        enableRubricVerification: this.config.enableRubricVerification,
        combineWithGVR: this.config.combineWithGVR,
      },
    );
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("Initializing VerificationPlugin...");

    this.initialized = true;
    console.log("VerificationPlugin initialized successfully");
  }

  async destroy(): Promise<void> {
    console.log("Destroying VerificationPlugin...");
    this.deepVerifier.clearHistory();
    this.initialized = false;
  }

  async rubricVerify(params: {
    request: string;
    result: string;
    context?: VerificationContext;
  }): Promise<{
    result: string;
    iterations: number;
    verified: boolean;
    rubricVerdict: string;
    gvrVerdict: string;
    combinedVerdict: boolean;
    suggestions: string[];
  }> {
    const { request, result, context } = params;

    const verification = await this.integration.verifyWithGVRAndRubric(
      request,
      result,
      context,
    );

    return {
      result: verification.result,
      iterations: verification.iterations,
      verified: verification.verified,
      rubricVerdict: verification.rubricVerdict || "cant_evaluate",
      gvrVerdict: verification.gvrVerdict || "uncertain",
      combinedVerdict: verification.combinedVerdict,
      suggestions: [],
    };
  }

  async rubricConfig(params: {
    action: "get" | "set" | "reset";
    config?: Partial<VerificationPluginConfig>;
    rubric?: Rubric;
  }): Promise<{
    success: boolean;
    message: string;
    config?: VerificationPluginConfig;
    rubrics?: string[];
  }> {
    const { action, config, rubric } = params;

    switch (action) {
      case "get": {
        return {
          success: true,
          message: "Configuration retrieved successfully",
          config: this.config,
          rubrics: this.deepVerifier.getAllRubrics(),
        };
      }

      case "set": {
        if (config) {
          this.config = { ...this.config, ...config };
          return {
            success: true,
            message: "Configuration updated successfully",
            config: this.config,
            rubrics: this.deepVerifier.getAllRubrics(),
          };
        }

        if (rubric) {
          this.integration.loadRubric(rubric as any);
          return {
            success: true,
            message: "Rubric added successfully",
            rubrics: this.deepVerifier.getAllRubrics(),
          };
        }

        return {
          success: false,
          message: "No configuration or rubric provided",
        };
      }

      case "reset": {
        this.config = { ...DEFAULT_PLUGIN_CONFIG };
        this.deepVerifier.clearHistory();
        return {
          success: true,
          message: "Configuration reset to defaults",
          config: this.config,
          rubrics: this.deepVerifier.getAllRubrics(),
        };
      }

      default:
        return {
          success: false,
          message: `Unknown action: ${action}`,
        };
    }
  }

  async verificationReport(params?: {
    includeHistory?: boolean;
  }): Promise<{
    success: boolean;
    report: {
      rubrics: string[];
      statistics: {
        verificationCount: number;
        passRate: number;
        avgConfidence: number;
      };
      taxonomy: {
        categories: ReturnType<typeof FailureTaxonomyFactory.getAllCategories>;
        subcategories: ReturnType<typeof FailureTaxonomyFactory.getAllSubcategories>;
      };
      history?: VerificationOutcome[];
    };
  }> {
    const includeHistory = params?.includeHistory ?? false;

    const report = this.integration.getRubricReport();
    const statistics = this.deepVerifier.getStatistics();

    return {
      success: true,
      report: {
        rubrics: report.rubrics,
        statistics: {
          verificationCount: statistics.verificationCount,
          passRate: statistics.passRate,
          avgConfidence: statistics.avgConfidence,
        },
        taxonomy: {
          categories: report.taxonomy.categories,
          subcategories: report.taxonomy.subcategories,
        },
        history: includeHistory ? statistics.history : undefined,
      },
    };
  }

  async clearVerificationCache(): Promise<{
    success: boolean;
    message: string;
  }> {
    this.deepVerifier.clearHistory();
    return {
      success: true,
      message: "Verification cache cleared successfully",
    };
  }

  getTools(): Record<string, (params: any) => Promise<any>> {
    return {
      "rubric-verify": this.rubricVerify.bind(this),
      "rubric-config": this.rubricConfig.bind(this),
      "verification-report": this.verificationReport.bind(this),
      "clear-verification-cache": this.clearVerificationCache.bind(this),
    };
  }

  getConfig(): VerificationPluginConfig {
    return { ...this.config };
  }

  getDeepVerifier(): DeepVerifier {
    return this.deepVerifier;
  }

  getIntegration(): GVRRubricIntegration {
    return this.integration;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

let pluginInstance: VerificationPlugin | null = null;

export async function createVerificationPlugin(
  verifier: VerificationLoop,
  config?: Partial<VerificationPluginConfig>,
): Promise<VerificationPlugin> {
  if (pluginInstance === null) {
    pluginInstance = new VerificationPlugin(verifier, config);
    await pluginInstance.initialize();
  }

  return pluginInstance;
}

export function getVerificationPlugin(): VerificationPlugin | null {
  return pluginInstance;
}

export async function destroyVerificationPlugin(): Promise<void> {
  if (pluginInstance !== null) {
    await pluginInstance.destroy();
    pluginInstance = null;
  }
}
