import { rm } from "node:fs/promises";

import { removeAliasShim } from "../alias/alias-shim.js";
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

  const aliasesToRemove = Object.entries(registry.aliases)
    .filter(([, alias]) => installedPackage.commands.includes(alias.targetCommand))
    .map(([aliasName]) => aliasName);

  for (const aliasName of aliasesToRemove) {
    delete registry.aliases[aliasName];
  }

  delete registry.packages[packageName];

  await writeRegistry(registry);

  await Promise.all(
    aliasesToRemove.map(async (aliasName) => {
      await removeAliasShim(aliasName);
    }),
  );
};
