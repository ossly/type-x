import { rm } from "node:fs/promises";

import { readRegistry, writeRegistry } from "../runtime/registry.js";

export const removePackage = async (packageName: string): Promise<void> => {
  const registry = await readRegistry();
  const installedPackage = registry.packages[packageName];

  if (!installedPackage) {
    throw new Error(`Package "${packageName}" is not installed.`);
  }

  await rm(installedPackage.path, { recursive: true, force: true });

  for (const commandName of installedPackage.commands) {
    delete registry.commands[commandName];
  }

  delete registry.packages[packageName];

  await writeRegistry(registry);
};
