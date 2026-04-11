import { resolve } from "node:path";

import { readRegistry } from "./registry.js";

export interface ResolvedCommand {
  commandName: string;
  packageName: string;
  packageVersion: string;
  packagePath: string;
  entry: string;
  entryFile: string;
  description: string;
}

export const resolveCommand = async (
  commandName: string,
): Promise<ResolvedCommand | null> => {
  const registry = await readRegistry();
  const command = registry.commands[commandName];

  if (!command) {
    return null;
  }

  const pkg = registry.packages[command.packageName];

  if (!pkg) {
    throw new Error(
      `Registry is inconsistent: package "${command.packageName}" for command "${commandName}" was not found.`,
    );
  }

  return {
    commandName,
    packageName: command.packageName,
    packageVersion: command.packageVersion,
    packagePath: pkg.path,
    entry: command.entry,
    entryFile: resolve(pkg.path, command.entry),
    description: command.description,
  };
};
