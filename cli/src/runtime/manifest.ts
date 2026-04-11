import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface PackageCommandManifest {
  entry: string;
  description: string;
}

export interface PackageManifest {
  packageName: string;
  packageVersion: string;
  packagePath: string;
  packageJsonPath: string;
  commands: Record<string, PackageCommandManifest>;
}

interface RawPackageManifest {
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

interface RawPackageCommandManifest {
  entry?: unknown;
  description?: unknown;
}

export const readPackageManifest = async (
  packagePath: string,
): Promise<PackageManifest> => {
  const resolvedPackagePath = resolve(packagePath);
  const packageJsonPath = resolve(resolvedPackagePath, "package.json");

  let packageJson: string;

  try {
    packageJson = await readFile(packageJsonPath, "utf8");
  } catch (error: unknown) {
    throw new Error(
      `Failed to read package manifest "${packageJsonPath}": ${getErrorMessage(error)}`,
    );
  }

  let manifest: RawPackageManifest;

  try {
    manifest = JSON.parse(packageJson) as RawPackageManifest;
  } catch (error: unknown) {
    throw new Error(
      `Failed to parse package manifest "${packageJsonPath}": ${getErrorMessage(error)}`,
    );
  }

  if (typeof manifest.name !== "string" || manifest.name.length === 0) {
    throw new Error(
      `Package "${resolvedPackagePath}" must define a non-empty name.`,
    );
  }

  if (typeof manifest.version !== "string" || manifest.version.length === 0) {
    throw new Error(
      `Package "${resolvedPackagePath}" must define a non-empty version.`,
    );
  }

  if (manifest.x?.runtime !== "1") {
    throw new Error(
      `Package "${resolvedPackagePath}" must define x.runtime as "1".`,
    );
  }

  if (!manifest.x.commands || Object.keys(manifest.x.commands).length === 0) {
    throw new Error(
      `Package "${resolvedPackagePath}" must define at least one x command.`,
    );
  }

  const commands = Object.fromEntries(
    Object.entries(manifest.x.commands).map(([commandName, command]) => [
      commandName,
      validateCommandManifest(resolvedPackagePath, commandName, command),
    ]),
  );

  return {
    packageName: manifest.name,
    packageVersion: manifest.version,
    packagePath: resolvedPackagePath,
    packageJsonPath,
    commands,
  };
};

export const getManifestCommand = (
  manifest: PackageManifest,
  commandName: string,
): PackageCommandManifest => {
  const command = manifest.commands[commandName];

  if (!command) {
    throw new Error(
      `Package "${manifest.packagePath}" does not define command "${commandName}".`,
    );
  }

  return command;
};

const validateCommandManifest = (
  packagePath: string,
  commandName: string,
  command: RawPackageCommandManifest | undefined,
): PackageCommandManifest => {
  if (typeof command?.entry !== "string" || command.entry.length === 0) {
    throw new Error(
      `Command "${commandName}" in "${packagePath}" must define a non-empty entry.`,
    );
  }

  if (
    typeof command.description !== "string" ||
    command.description.length === 0
  ) {
    throw new Error(
      `Command "${commandName}" in "${packagePath}" must define a non-empty description.`,
    );
  }

  return {
    entry: command.entry,
    description: command.description,
  };
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};
