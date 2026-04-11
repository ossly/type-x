import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ResolvedCommand } from "./resolve-command.js";

interface LocalPackageManifest {
  name?: unknown;
  version?: unknown;
  x?: {
    runtime?: unknown;
    commands?: Record<
      string,
      {
        entry?: unknown;
        description?: unknown;
      }
    >;
  };
}

export const resolveLocalCommand = async (
  packagePath: string,
  commandName: string,
): Promise<ResolvedCommand> => {
  const resolvedPackagePath = resolve(packagePath);
  const packageJsonPath = resolve(resolvedPackagePath, "package.json");
  const packageJson = await readFile(packageJsonPath, "utf8");
  const manifest = JSON.parse(packageJson) as LocalPackageManifest;

  if (manifest.x?.runtime !== "1") {
    throw new Error(
      `Local package "${resolvedPackagePath}" must define x.runtime as "1".`,
    );
  }

  const command = manifest.x.commands?.[commandName];

  if (!command) {
    throw new Error(
      `Local package "${resolvedPackagePath}" does not define command "${commandName}".`,
    );
  }

  if (typeof command.entry !== "string" || command.entry.length === 0) {
    throw new Error(
      `Command "${commandName}" in "${resolvedPackagePath}" must define a non-empty entry.`,
    );
  }

  if (
    typeof command.description !== "string" ||
    command.description.length === 0
  ) {
    throw new Error(
      `Command "${commandName}" in "${resolvedPackagePath}" must define a non-empty description.`,
    );
  }

  if (typeof manifest.name !== "string" || manifest.name.length === 0) {
    throw new Error(
      `Local package "${resolvedPackagePath}" must define a non-empty package name.`,
    );
  }

  if (typeof manifest.version !== "string" || manifest.version.length === 0) {
    throw new Error(
      `Local package "${resolvedPackagePath}" must define a non-empty version.`,
    );
  }

  return {
    commandName,
    packageName: manifest.name,
    packageVersion: manifest.version,
    packagePath: resolvedPackagePath,
    entry: command.entry,
    entryFile: resolve(resolvedPackagePath, command.entry),
    description: command.description,
  };
};
