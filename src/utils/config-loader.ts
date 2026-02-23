import type { z } from "zod";
import { readJSONFile } from "./file-utils";
import { loadYamlFile } from "./yaml-parser";
import type { YamlNode } from "./yaml-parser";

export interface ConfigLoadOptions<T> {
  path: string;
  default: T;
  schema?: z.ZodType<T>;
}

export interface LoadResult<T> {
  success: boolean;
  data: T;
  loadedFromFile: boolean;
}

export async function loadConfig<T = YamlNode>(
  options: ConfigLoadOptions<T>,
): Promise<LoadResult<T>> {
  const { path, default: defaultConfig, schema } = options;

  const parsed = await loadYamlFile<YamlNode>(path);

  if (!parsed) {
    return {
      success: false,
      data: defaultConfig,
      loadedFromFile: false,
    };
  }

  try {
    const data = schema ? schema.parse(parsed) : (parsed as unknown as T);
    return {
      success: true,
      data,
      loadedFromFile: true,
    };
  } catch (error) {
    console.warn(`Config validation failed for ${path}, using default:`, error);
    return {
      success: false,
      data: defaultConfig,
      loadedFromFile: false,
    };
  }
}

export async function loadJSONConfig<T = unknown>(
  path: string,
  defaultConfig: T,
): Promise<LoadResult<T>> {
  const result = await readJSONFile<T>(path);

  if (!result.success || !result.data) {
    return {
      success: false,
      data: defaultConfig,
      loadedFromFile: false,
    };
  }

  return {
    success: true,
    data: result.data,
    loadedFromFile: true,
  };
}

export function mergeConfigs<T>(...configs: Partial<T>[]): T {
  return configs.reduce<T>((merged, config) => ({ ...merged, ...config }), {} as T);
}
