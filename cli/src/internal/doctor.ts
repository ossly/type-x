import type { CommandHandler } from "@type-x/types";
import { getAliasShimPath } from "../alias/alias-shim.js";
import { ensureRuntimeDirs } from "../runtime/paths.js";
import { readRegistry, writeRegistry } from "../runtime/registry.js";
import { getShellSetupSuggestion } from "../shell/setup-shell.js";

export const doctor: CommandHandler = async ({ request }) => {
  const paths = await ensureRuntimeDirs();
  const registry = await readRegistry();
  const shellSetup = getShellSetupSuggestion();
  const aliasNames = Object.keys(registry.aliases).sort();
  const missingAliasShims: string[] = [];

  await writeRegistry(registry);

  for (const aliasName of aliasNames) {
    const shimPath = await getAliasShimPath(aliasName);

    try {
      await import("node:fs/promises").then(({ access }) => access(shimPath));
    } catch {
      missingAliasShims.push(aliasName);
    }
  }

  console.log("Paths");
  console.log(`  pwd: ${request.pwd}`);
  console.log(`  homeDir: ${paths.homeDir}`);
  console.log(`  registryFile: ${paths.registryFile}`);
  console.log(`  packagesDir: ${paths.packagesDir}`);
  console.log(`  storesDir: ${paths.storesDir}`);
  console.log(`  binDir: ${paths.binDir}`);
  console.log(`  tmpDir: ${paths.tmpDir}`);
  console.log("");
  console.log("Shell");
  console.log(`  shell: ${shellSetup.shellName}`);
  console.log(
    `  rcFile: ${shellSetup.rcFile ?? "not supported automatically"}`,
  );
  console.log(`  pathConfigured: ${shellSetup.pathConfigured ? "yes" : "no"}`);
  if (!shellSetup.pathConfigured) {
    console.log(`  exportLine: ${shellSetup.exportLine}`);
  }
  console.log("");
  console.log("Registry");
  console.log(`  packages: ${Object.keys(registry.packages).length}`);
  console.log(`  commands: ${Object.keys(registry.commands).length}`);
  console.log(`  aliases: ${aliasNames.length}`);
  console.log(`  missingAliasShims: ${missingAliasShims.length}`);
  if (missingAliasShims.length > 0) {
    console.log(`  missingAliasShimNames: ${missingAliasShims.join(", ")}`);
  }
};
