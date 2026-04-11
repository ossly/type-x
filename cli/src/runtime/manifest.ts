import { readFile, stat } from "node:fs/promises";
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

  if (typeof manifest.name !== "string" || manifest.name.trim().length === 0) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "name" to be a non-empty string.`,
    );
  }

  if (
    typeof manifest.version !== "string" ||
    manifest.version.trim().length === 0
  ) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "version" to be a non-empty string.`,
    );
  }

  if (!isRecord(manifest.x)) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x" to be an object.`,
    );
  }

  if (manifest.x.runtime !== "1") {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x.runtime" to be "1", received ${describeValue(manifest.x.runtime)}.`,
    );
  }

  if (!isRecord(manifest.x.commands)) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x.commands" to be an object.`,
    );
  }

  const commandEntries = Object.entries(manifest.x.commands);

  if (commandEntries.length === 0) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x.commands" to define at least one command.`,
    );
  }

  const validatedCommands = await Promise.all(
    commandEntries.map(async ([commandName, command]) => {
      const validatedCommand = await validateCommandManifest(
        resolvedPackagePath,
        packageJsonPath,
        commandName,
        command,
      );

      return [commandName, validatedCommand] as const;
    }),
  );

  const commands = Object.fromEntries(validatedCommands);

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

const validateCommandManifest = async (
  packagePath: string,
  packageJsonPath: string,
  commandName: string,
  command: RawPackageCommandManifest | undefined,
): Promise<PackageCommandManifest> => {
  if (!isRecord(command)) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x.commands.${commandName}" to be an object.`,
    );
  }

  if (typeof command.entry !== "string" || command.entry.trim().length === 0) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x.commands.${commandName}.entry" to be a non-empty string.`,
    );
  }

  if (
    typeof command.description !== "string" ||
    command.description.trim().length === 0
  ) {
    throw new Error(
      `Invalid package manifest "${packageJsonPath}": expected "x.commands.${commandName}.description" to be a non-empty string.`,
    );
  }

  const entryFile = resolve(packagePath, command.entry);

  try {
    const entryFileStats = await stat(entryFile);

    if (!entryFileStats.isFile()) {
      throw new Error(
        `Invalid package manifest "${packageJsonPath}": command "${commandName}" entry "${command.entry}" does not point to a file.`,
      );
    }
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      throw new Error(
        `Invalid package manifest "${packageJsonPath}": command "${commandName}" entry "${command.entry}" was not found at "${entryFile}".`,
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      `Invalid package manifest "${packageJsonPath}": failed to inspect command "${commandName}" entry "${command.entry}".`,
    );
  }

  return {
    entry: command.entry,
    description: command.description,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const describeValue = (value: unknown): string => {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (value === undefined) {
    return "undefined";
  }

  return JSON.stringify(value) ?? String(value);
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};
