import { existsSync } from "node:fs";
import { STRATEGY_CONFIG } from "../../../constants/router";
import { IntentRoutesSchema, type ValidatedRouteConfig } from "../../../schemas";
import type { RouteConfig } from "../../../types/router";
import { logger } from "../../../utils/logger";
import { resolveToConfig } from "../../../utils/path";
import { parseSimpleYaml } from "../../../utils/yaml-parser";

export class RouteConfigManager {
  constructor(private configPath: string) {}

  async loadRoutes(): Promise<Map<string, RouteConfig>> {
    const routes = new Map<string, RouteConfig>();

    if (existsSync(this.configPath)) {
      try {
        const content = await Bun.file(this.configPath).text();
        const yaml = parseSimpleYaml(content);

        const validated = IntentRoutesSchema.parse(yaml);

        if (validated.routes) {
          for (const [name, config] of Object.entries(validated.routes)) {
            routes.set(name, config as RouteConfig);
          }
        }
      } catch (error) {
        logger.error("Failed to load config file:", error);
        throw new Error(`Invalid route configuration at ${this.configPath}: ${error}`);
      }
    } else {
      logger.error(`Route configuration file not found: ${this.configPath}`);
      throw new Error(`Route configuration file not found: ${this.configPath}`);
    }

    if (routes.size === 0) {
      logger.error(`No valid routes found in ${this.configPath}`);
      throw new Error(`No valid routes found in ${this.configPath}`);
    }

    return routes;
  }

  addRoute(routes: Map<string, RouteConfig>, name: string, config: RouteConfig): void {
    routes.set(name, config);
  }

  getStrategyConfig() {
    return STRATEGY_CONFIG;
  }
}
