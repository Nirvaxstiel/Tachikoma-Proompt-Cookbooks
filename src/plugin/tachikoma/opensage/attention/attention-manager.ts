import type {
  AttentionConfig,
  ResidualConfig,
  SynthesisConfig,
  InterAgentAttention,
  AttentionPerformanceMetrics,
} from "./types";
import { ScaledDotProductAttention } from "./scaled-dot-product-attention";
import { InterLayerResidual } from "./inter-layer-residual";
import { AttentionBasedSynthesis } from "./attention-synthesis";
import {
  DEFAULT_ATTENTION_CONFIG,
  DEFAULT_RESIDUAL_CONFIG,
  DEFAULT_SYNTHESIS_CONFIG,
  validateAttentionConfig,
  validateResidualConfig,
  validateSynthesisConfig,
  getAvailablePresets,
} from "./attention-config";

export interface AttentionManagerConfig {
  attentionConfig: Partial<AttentionConfig>;
  residualConfig: Partial<ResidualConfig>;
  synthesisConfig: Partial<SynthesisConfig>;
}

export class AttentionManager {
  private attentionModule: InterAgentAttention | null;
  private residualModule: InterLayerResidual | null;
  private synthesisModule: AttentionBasedSynthesis | null;
  private config: AttentionManagerConfig;
  private initialized: boolean;
  private performanceMetrics: {
    startTime: number;
    totalOperations: number;
    totalAttentionTime: number;
    totalResidualTime: number;
    totalSynthesisTime: number;
  };

  constructor(config?: Partial<AttentionManagerConfig>) {
    this.config = {
      attentionConfig: config?.attentionConfig || {},
      residualConfig: config?.residualConfig || {},
      synthesisConfig: config?.synthesisConfig || {},
    };

    this.attentionModule = null;
    this.residualModule = null;
    this.synthesisModule = null;
    this.initialized = false;

    this.performanceMetrics = {
      startTime: Date.now(),
      totalOperations: 0,
      totalAttentionTime: 0,
      totalResidualTime: 0,
      totalSynthesisTime: 0,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("Initializing AttentionManager...");

    this.attentionModule = new ScaledDotProductAttention(this.config.attentionConfig);
    this.residualModule = new InterLayerResidual(this.config.residualConfig);
    this.synthesisModule = new AttentionBasedSynthesis(this.config.synthesisConfig);

    this.initialized = true;

    console.log("AttentionManager initialized successfully");
  }

  async destroy(): Promise<void> {
    console.log("Destroying AttentionManager...");

    this.attentionModule?.reset();
    this.residualModule?.reset();

    this.attentionModule = null;
    this.residualModule = null;
    this.synthesisModule = null;
    this.initialized = false;

    console.log("AttentionManager destroyed");
  }

  getAttentionModule(): InterAgentAttention | null {
    return this.attentionModule;
  }

  getResidualModule(): InterLayerResidual | null {
    return this.residualModule;
  }

  getSynthesisModule(): AttentionBasedSynthesis | null {
    return this.synthesisModule;
  }

  getConfig(): AttentionManagerConfig {
    return {
      attentionConfig: { ...this.config.attentionConfig },
      residualConfig: { ...this.config.residualConfig },
      synthesisConfig: { ...this.config.synthesisConfig },
    };
  }

  updateAttentionConfig(config: Partial<AttentionConfig>): void {
    const validation = validateAttentionConfig(config);

    if (!validation.valid) {
      throw new Error(`Invalid attention config: ${validation.errors.join(", ")}`);
    }

    this.config.attentionConfig = { ...this.config.attentionConfig, ...config };

    if (this.attentionModule) {
      this.attentionModule.reset();
    }
  }

  updateResidualConfig(config: Partial<ResidualConfig>): void {
    const validation = validateResidualConfig(config);

    if (!validation.valid) {
      throw new Error(`Invalid residual config: ${validation.errors.join(", ")}`);
    }

    this.config.residualConfig = { ...this.config.residualConfig, ...config };

    if (this.residualModule) {
      this.residualModule.reset();
    }
  }

  updateSynthesisConfig(config: Partial<SynthesisConfig>): void {
    const validation = validateSynthesisConfig(config);

    if (!validation.valid) {
      throw new Error(`Invalid synthesis config: ${validation.errors.join(", ")}`);
    }

    this.config.synthesisConfig = { ...this.config.synthesisConfig, ...config };

    if (this.synthesisModule) {
      this.synthesisModule.setStrategy(config.strategy || "weighted-average");
      if (config.temperature !== undefined) {
        this.synthesisModule.setTemperature(config.temperature);
      }
    }
  }

  loadPreset(presetName: string, type: "attention" | "synthesis"): void {
    if (type === "attention") {
      const preset = DEFAULT_ATTENTION_CONFIG;
      this.updateAttentionConfig(preset);
    } else if (type === "synthesis") {
      const preset = DEFAULT_SYNTHESIS_CONFIG;
      this.updateSynthesisConfig(preset);
    }
  }

  getAvailablePresets(): {
    attention: string[];
    synthesis: string[];
  } {
    return getAvailablePresets();
  }

  reset(): void {
    this.attentionModule?.reset();
    this.residualModule?.reset();

    this.performanceMetrics = {
      startTime: Date.now(),
      totalOperations: 0,
      totalAttentionTime: 0,
      totalResidualTime: 0,
      totalSynthesisTime: 0,
    };
  }

  getPerformanceMetrics(): {
    uptime: number;
    totalOperations: number;
    averageAttentionTime: number;
    averageResidualTime: number;
    averageSynthesisTime: number;
    averageTotalTime: number;
  } {
    const uptime = Date.now() - this.performanceMetrics.startTime;

    const avgAttentionTime =
      this.performanceMetrics.totalOperations > 0
        ? this.performanceMetrics.totalAttentionTime / this.performanceMetrics.totalOperations
        : 0;

    const avgResidualTime =
      this.performanceMetrics.totalOperations > 0
        ? this.performanceMetrics.totalResidualTime / this.performanceMetrics.totalOperations
        : 0;

    const avgSynthesisTime =
      this.performanceMetrics.totalOperations > 0
        ? this.performanceMetrics.totalSynthesisTime / this.performanceMetrics.totalOperations
        : 0;

    const avgTotalTime = avgAttentionTime + avgResidualTime + avgSynthesisTime;

    return {
      uptime,
      totalOperations: this.performanceMetrics.totalOperations,
      averageAttentionTime: avgAttentionTime,
      averageResidualTime: avgResidualTime,
      averageSynthesisTime: avgSynthesisTime,
      averageTotalTime: avgTotalTime,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  recordOperationMetrics(metrics: {
    attentionTime?: number;
    residualTime?: number;
    synthesisTime?: number;
  }): void {
    this.performanceMetrics.totalOperations++;

    if (metrics.attentionTime !== undefined) {
      this.performanceMetrics.totalAttentionTime += metrics.attentionTime;
    }

    if (metrics.residualTime !== undefined) {
      this.performanceMetrics.totalResidualTime += metrics.residualTime;
    }

    if (metrics.synthesisTime !== undefined) {
      this.performanceMetrics.totalSynthesisTime += metrics.synthesisTime;
    }
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson) as AttentionManagerConfig;

      if (config.attentionConfig) {
        this.updateAttentionConfig(config.attentionConfig);
      }

      if (config.residualConfig) {
        this.updateResidualConfig(config.residualConfig);
      }

      if (config.synthesisConfig) {
        this.updateSynthesisConfig(config.synthesisConfig);
      }
    } catch (error) {
      throw new Error(`Failed to import config: ${error}`);
    }
  }

  validateCurrentConfig(): {
    valid: boolean;
    errors: {
      attention: string[];
      residual: string[];
      synthesis: string[];
    };
  } {
    const attentionValidation = validateAttentionConfig(this.config.attentionConfig);
    const residualValidation = validateResidualConfig(this.config.residualConfig);
    const synthesisValidation = validateSynthesisConfig(this.config.synthesisConfig);

    return {
      valid:
        attentionValidation.valid &&
        residualValidation.valid &&
        synthesisValidation.valid,
      errors: {
        attention: attentionValidation.errors,
        residual: residualValidation.errors,
        synthesis: synthesisValidation.errors,
      },
    };
  }
}

let attentionManager: AttentionManager | null = null;

export async function createAttentionManager(
  config?: Partial<AttentionManagerConfig>,
): Promise<AttentionManager> {
  if (attentionManager === null) {
    attentionManager = new AttentionManager(config);
    await attentionManager.initialize();
  }

  return attentionManager;
}

export function getAttentionManager(): AttentionManager | null {
  return attentionManager;
}

export async function destroyAttentionManager(): Promise<void> {
  if (attentionManager !== null) {
    await attentionManager.destroy();
    attentionManager = null;
  }
}
