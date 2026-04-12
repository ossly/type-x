import { rm } from "node:fs/promises";

import { removeAliasShim } from "../alias/alias-shim.js";
import { getStoreFilePath } from "../runtime/command-store.js";
import { readRegistry, writeRegistry } from "../runtime/registry.js";

export const removePackage = async (packageName: string): Promise<void> => {
  const registry = await readRegistry();
  const installedPackage = registry.packages[packageName];

  if (!installedPackage) {
    throw new Error(`Package "${packageName}" is not installed.`);
  }

  const nextRegistry = {
    ...registry,
    packages: {
      ...registry.packages,
    },
    commands: {
      ...registry.commands,
    },
    aliases: {
      ...registry.aliases,
    },
  };

  for (const commandName of installedPackage.commands) {
    delete nextRegistry.commands[commandName];
  }

  const aliasesToRemove = Object.entries(nextRegistry.aliases)
    .filter(([, alias]) => installedPackage.commands.includes(alias.targetCommand))
    .map(([aliasName]) => aliasName);

  for (const aliasName of aliasesToRemove) {
    delete nextRegistry.aliases[aliasName];
  }

  delete nextRegistry.packages[packageName];

  await writeRegistry(nextRegistry);

  const cleanupErrors: string[] = [];

  try {
    await rm(installedPackage.path, { recursive: true, force: true });
  } catch (error: unknown) {
    cleanupErrors.push(
      `Failed to delete package files at "${installedPackage.path}": ${getErrorMessage(error)}`,
    );
  }

  await Promise.all(
    aliasesToRemove.map(async (aliasName) => {
      try {
        await removeAliasShim(aliasName);
      } catch (error: unknown) {
        cleanupErrors.push(
          `Failed to delete alias shim "${aliasName}": ${getErrorMessage(error)}`,
        );
      }
    }),
  );

  const storeFilePath = await getStoreFilePath(packageName);

  try {
    await rm(storeFilePath, { force: true });
  } catch (error: unknown) {
    cleanupErrors.push(
      `Failed to delete store file "${storeFilePath}": ${getErrorMessage(error)}`,
    );
  }

  if (cleanupErrors.length > 0) {
    throw new Error(
      `Package "${packageName}" was removed from the registry, but cleanup was incomplete.\n${cleanupErrors.join("\n")}`,
    );
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
