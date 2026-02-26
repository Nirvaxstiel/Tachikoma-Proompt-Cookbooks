#!/usr/bin/env bun
/**
 * Where is Tachikoma installed?
 * Shows the installation location and available scripts
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { cliLogger } from "../../utils/cli-logger";
import { getConfigPath, getPluginDir } from "../../utils/platform-paths";

async function findInstallation(): Promise<string> {
  const candidates = [getConfigPath("tachikoma"), join(process.cwd(), ".opencode", "tachikoma")];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return getPluginDir();
}

async function main(): Promise<void> {
  cliLogger.info("Tachikoma Installation");
  cliLogger.info("=====================\n");

  const installationPath = await findInstallation();
  cliLogger.info(`Location: ${installationPath}\n`);

  // Try to list scripts
  const pluginDir = join(installationPath, "plugins", "tachikoma");

  if (existsSync(pluginDir)) {
    cliLogger.info("Plugin Directory:");
    cliLogger.info(`  ${pluginDir}\n`);

    const scriptsDir = join(pluginDir, "tachikoma");

    if (existsSync(scriptsDir)) {
      cliLogger.info("Available Scripts:");

      const files = readdirSync(scriptsDir).filter((f) => f.endsWith(".ts") && !f.startsWith("_"));

      if (files.length > 0) {
        for (const file of files) {
          const scriptName = file.replace(".ts", "");
          cliLogger.info(`  - tachikoma.${scriptName}`);
        }
      } else {
        cliLogger.info("  (no scripts found)");
      }
    }
  } else {
    cliLogger.info("Scripts Directory:");
    cliLogger.info(`  ${installationPath}\n`);
    cliLogger.info("Note: Run 'bun run install.ts' to set up the plugin structure.");
  }

  cliLogger.info("\nUsage:");
  cliLogger.info("  @tachikoma                    # Use agent");
  cliLogger.info("  /tachikoma-where               # Run this script");
}

main().catch((err) => {
  cliLogger.error("Script execution failed", err);
  process.exit(1);
});
