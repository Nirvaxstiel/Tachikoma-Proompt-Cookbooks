import type {
  AttentionMechanism,
  AttentionConfig,
  ResidualConfig,
  SynthesisConfig,
  SynthesisStrategy,
} from "./types";

export const DEFAULT_ATTENTION_CONFIG: AttentionConfig = {
  mechanism: "scaled-dot-product",
  numHeads: 8,
  temperature: 1.0,
  dropout: 0.1,
  enableCaching: true,
  cacheSize: 1000,
};

export const DEFAULT_RESIDUAL_CONFIG: ResidualConfig = {
  residualWeight: 0.5,
  enableLayerNorm: true,
  enableGating: true,
  adaptiveResidual: true,
  learningRate: 0.001,
};

export const DEFAULT_SYNTHESIS_CONFIG: SynthesisConfig = {
  strategy: "weighted-average",
  temperature: 1.0,
  enableQualityMetrics: true,
  consensusThreshold: 0.7,
};

export const ATTENTION_PRESETS: Record<
  string,
  Partial<AttentionConfig> & { description: string }
> = {
  FastInference: {
    description: "Optimized for fast inference with fewer heads and higher dropout",
    mechanism: "scaled-dot-product",
    numHeads: 4,
    temperature: 1.2,
    dropout: 0.2,
  },

  HighQuality: {
    description: "Optimized for quality with more heads and lower temperature",
    mechanism: "scaled-dot-product",
    numHeads: 16,
    temperature: 0.8,
    dropout: 0.05,
  },

  Balanced: {
    description: "Balanced settings for good quality and performance",
    mechanism: "scaled-dot-product",
    numHeads: 8,
    temperature: 1.0,
    dropout: 0.1,
  },
};

export const SYNTHESIS_PRESETS: Record<
  string,
  Partial<SynthesisConfig> & { description: string }
> = {
  WeightedAverage: {
    description: "Weighted average synthesis using attention weights",
    strategy: "weighted-average",
    temperature: 1.0,
  },

  Consensus: {
    description: "Consensus-driven synthesis for high confidence",
    strategy: "consensus",
    temperature: 0.8,
    consensusThreshold: 0.8,
  },

  Selection: {
    description: "Select output with highest attention weight",
    strategy: "selection",
    temperature: 0.5,
  },
};

export function validateAttentionConfig(
  config: Partial<AttentionConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.numHeads !== undefined) {
    if (config.numHeads < 1) {
      errors.push("numHeads must be at least 1");
    }
    if (config.numHeads > 32) {
      errors.push("numHeads should not exceed 32 for performance");
    }
  }

  if (config.temperature !== undefined) {
    if (config.temperature <= 0) {
      errors.push("temperature must be positive");
    }
    if (config.temperature > 10) {
      errors.push("temperature should not exceed 10");
    }
  }

  if (config.dropout !== undefined) {
    if (config.dropout < 0) {
      errors.push("dropout must be non-negative");
    }
    if (config.dropout > 1) {
      errors.push("dropout must not exceed 1");
    }
  }

  if (config.cacheSize !== undefined) {
    if (config.cacheSize < 0) {
      errors.push("cacheSize must be non-negative");
    }
  }

  if (config.mechanism !== undefined) {
    const validMechanisms: AttentionMechanism[] = [
      "scaled-dot-product",
      "additive",
      "multi-head",
    ];
    if (!validMechanisms.includes(config.mechanism)) {
      errors.push(
        `mechanism must be one of: ${validMechanisms.join(", ")}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateResidualConfig(
  config: Partial<ResidualConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.residualWeight !== undefined) {
    if (config.residualWeight < 0) {
      errors.push("residualWeight must be non-negative");
    }
    if (config.residualWeight > 1) {
      errors.push("residualWeight must not exceed 1");
    }
  }

  if (config.learningRate !== undefined) {
    if (config.learningRate <= 0) {
      errors.push("learningRate must be positive");
    }
    if (config.learningRate > 1) {
      errors.push("learningRate should not exceed 1");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSynthesisConfig(
  config: Partial<SynthesisConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.temperature !== undefined) {
    if (config.temperature <= 0) {
      errors.push("temperature must be positive");
    }
  }

  if (config.consensusThreshold !== undefined) {
    if (config.consensusThreshold < 0) {
      errors.push("consensusThreshold must be non-negative");
    }
    if (config.consensusThreshold > 1) {
      errors.push("consensusThreshold must not exceed 1");
    }
  }

  if (config.strategy !== undefined) {
    const validStrategies: SynthesisStrategy[] = [
      "weighted-average",
      "concatenation",
      "consensus",
      "selection",
    ];
    if (!validStrategies.includes(config.strategy)) {
      errors.push(
        `strategy must be one of: ${validStrategies.join(", ")}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function loadAttentionPreset(
  presetName: string,
): Partial<AttentionConfig> | undefined {
  return ATTENTION_PRESETS[presetName];
}

export function loadSynthesisPreset(
  presetName: string,
): Partial<SynthesisConfig> | undefined {
  return SYNTHESIS_PRESETS[presetName];
}

export function getAvailablePresets(): {
  attention: string[];
  synthesis: string[];
} {
  return {
    attention: Object.keys(ATTENTION_PRESETS),
    synthesis: Object.keys(SYNTHESIS_PRESETS),
  };
}
