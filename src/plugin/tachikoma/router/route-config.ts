/**
 * Route configuration and loading
 */

import { existsSync } from "node:fs";
import { DEFAULT_ROUTES, STRATEGY_CONFIG } from "../../../constants/router";
import type { RouteConfig } from "../../../types/router";
import { logger } from "../../../utils/logger";
import { resolveToConfig } from "../../../utils/path";

export class RouteConfigManager {
  constructor(private configPath: string) {}

  loadRoutes(): Map<string, RouteConfig> {
    const routes = new Map<string, RouteConfig>();

    if (existsSync(this.configPath)) {
      try {
        const content = Bun.file(this.configPath).text();
        this.configureRoutes(routes, DEFAULT_ROUTES);
        return routes;
      } catch {
        logger.warn("Failed to load config file, using defaults");
      }
    }

    this.configureRoutes(routes, DEFAULT_ROUTES);
    return routes;
  }

  private configureRoutes(routes: Map<string, RouteConfig>, routeList: RouteConfig[]): void {
    for (const route of routeList) {
      routes.set(route.patterns[0], route);
    }
  }

  addRoute(routes: Map<string, RouteConfig>, name: string, config: RouteConfig): void {
    routes.set(name, config);
  }

  getStrategyConfig() {
    return STRATEGY_CONFIG;
  }
}
