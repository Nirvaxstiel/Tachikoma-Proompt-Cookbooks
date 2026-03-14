import type { TrackingConfig, RoutingConfig } from "./types";

export const DEFAULT_TRACKING_CONFIG: Required<TrackingConfig> = {
  enableTracking: true,
  maxHistorySize: 10000,
  learningRate: 0.01,
  confidenceThreshold: 0.7,
  updateFrequency: 10,
  minExecutionsForConfidence: 5,
  decayFactor: 0.99,
  enableExploration: true,
  explorationRate: 0.1,
  anomalyDetection: true,
  anomalyThreshold: 2.0,
};

export const DEFAULT_ROUTING_CONFIG: Required<RoutingConfig> = {
  strategy: "hybrid",
  useCompetenceModel: true,
  fallbackToStatic: true,
  competenceWeight: 0.6,
  costWeight: 0.2,
  speedWeight: 0.2,
  diversityFactor: 0.1,
};

export const TRACKING_PRESETS: Record<
  string,
  Partial<TrackingConfig> & { description: string }
> = {
  FastLearning: {
    description: "Fast learning with higher learning rate and lower threshold",
    learningRate: 0.05,
    confidenceThreshold: 0.6,
    updateFrequency: 5,
  },

  BalancedLearning: {
    description: "Balanced learning with default settings",
    learningRate: 0.01,
    confidenceThreshold: 0.7,
    updateFrequency: 10,
  },

  StableLearning: {
    description: "Stable learning with lower learning rate and higher threshold",
    learningRate: 0.001,
    confidenceThreshold: 0.8,
    updateFrequency: 20,
  },

  HighExploration: {
    description: "High exploration rate for discovering new skill patterns",
    enableExploration: true,
    explorationRate: 0.3,
    learningRate: 0.02,
  },

  LowExploration: {
    description: "Low exploration rate for exploiting known good skills",
    enableExploration: true,
    explorationRate: 0.05,
    learningRate: 0.005,
  },
};

export const ROUTING_PRESETS: Record<
  string,
  Partial<RoutingConfig> & { description: string }
> = {
  CompetenceOnly: {
    description: "Route based purely on skill competence",
    strategy: "competence-based",
    useCompetenceModel: true,
    fallbackToStatic: false,
    competenceWeight: 1.0,
    costWeight: 0.0,
    speedWeight: 0.0,
  },

  Balanced: {
    description: "Balance competence, cost, and speed in routing",
    strategy: "hybrid",
    useCompetenceModel: true,
    fallbackToStatic: true,
    competenceWeight: 0.6,
    costWeight: 0.2,
    speedWeight: 0.2,
  },

  CostOptimized: {
    description: "Prioritize low-cost skills",
    strategy: "competence-based",
    useCompetenceModel: true,
    fallbackToStatic: true,
    competenceWeight: 0.4,
    costWeight: 0.5,
    speedWeight: 0.1,
  },

  SpeedOptimized: {
    description: "Prioritize fast skills",
    strategy: "competence-based",
    useCompetenceModel: true,
    fallbackToStatic: true,
    competenceWeight: 0.4,
    costWeight: 0.1,
    speedWeight: 0.5,
  },
};

export function validateTrackingConfig(
  config: Partial<TrackingConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.learningRate !== undefined) {
    if (config.learningRate <= 0) {
      errors.push("learningRate must be positive");
    }
    if (config.learningRate > 1) {
      errors.push("learningRate should not exceed 1");
    }
  }

  if (config.confidenceThreshold !== undefined) {
    if (config.confidenceThreshold < 0) {
      errors.push("confidenceThreshold must be non-negative");
    }
    if (config.confidenceThreshold > 1) {
      errors.push("confidenceThreshold must not exceed 1");
    }
  }

  if (config.maxHistorySize !== undefined) {
    if (config.maxHistorySize < 0) {
      errors.push("maxHistorySize must be non-negative");
    }
  }

  if (config.explorationRate !== undefined) {
    if (config.explorationRate < 0) {
      errors.push("explorationRate must be non-negative");
    }
    if (config.explorationRate > 1) {
      errors.push("explorationRate must not exceed 1");
    }
  }

  if (config.decayFactor !== undefined) {
    if (config.decayFactor < 0) {
      errors.push("decayFactor must be non-negative");
    }
    if (config.decayFactor > 1) {
      errors.push("decayFactor must not exceed 1");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRoutingConfig(
  config: Partial<RoutingConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.competenceWeight !== undefined) {
    if (config.competenceWeight < 0) {
      errors.push("competenceWeight must be non-negative");
    }
    if (config.competenceWeight > 1) {
      errors.push("competenceWeight must not exceed 1");
    }
  }

  if (config.costWeight !== undefined) {
    if (config.costWeight < 0) {
      errors.push("costWeight must be non-negative");
    }
    if (config.costWeight > 1) {
      errors.push("costWeight must not exceed 1");
    }
  }

  if (config.speedWeight !== undefined) {
    if (config.speedWeight < 0) {
      errors.push("speedWeight must be non-negative");
    }
    if (config.speedWeight > 1) {
      errors.push("speedWeight must not exceed 1");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function loadTrackingPreset(
  presetName: string,
): Partial<TrackingConfig> | undefined {
  return TRACKING_PRESETS[presetName];
}

export function loadRoutingPreset(
  presetName: string,
): Partial<RoutingConfig> | undefined {
  return ROUTING_PRESETS[presetName];
}

export function getAvailablePresets(): {
  tracking: string[];
  routing: string[];
} {
  return {
    tracking: Object.keys(TRACKING_PRESETS),
    routing: Object.keys(ROUTING_PRESETS),
  };
}
