import type { RepeatedFlagsMode } from "@type-x/runtime";
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ensureRuntimeDirs, getRuntimePaths } from "./paths.js";

export interface RegistryPackage {
  name: string;
  version: string;
  path: string;
  commands: string[];
  source?: RegistryPackageSource;
}

export interface RegistryPackageSource {
  kind: "npm" | "local";
  specifier: string;
  registryUrl?: string;
  scope?: string;
  tokenEnvName?: string;
}

export interface RegistryCommand {
  packageName: string;
  packageVersion: string;
  entry: string;
  description: string;
  runtime?: RegistryCommandRuntimeOptions;
}

export interface RegistryCommandRuntimeOptions {
  repeatedFlags?: RepeatedFlagsMode;
}

export interface RegistryAlias {
  targetCommand: string;
}

export interface Registry {
  version: 1;
  packages: Record<string, RegistryPackage>;
  commands: Record<string, RegistryCommand>;
  aliases: Record<string, RegistryAlias>;
}

export const createEmptyRegistry = (): Registry => ({
  version: 1,
  packages: {},
  commands: {},
  aliases: {},
});

export const readRegistry = async (): Promise<Registry> => {
  const { registryFile } = getRuntimePaths();

  let content: string;
  try {
    content = await readFile(registryFile, "utf8");
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return createEmptyRegistry();
    }
    throw error;
  }

  let parsed: Partial<Registry>;
  try {
    parsed = JSON.parse(content) as Partial<Registry>;
  } catch {
    throw new Error(
      `Registry file is corrupted and cannot be parsed: ${registryFile}\n` +
        `You can reset it by deleting the file and running "x add" again.`,
    );
  }

  if (parsed.version !== 1) {
    process.stderr.write(
      `Warning: registry version ${String(parsed.version)} is not supported (expected 1). Some data may be ignored.\n`,
    );
  }

  const packages = Object.fromEntries(
    Object.entries(parsed.packages ?? {}).map(([packageName, pkg]) => [
      packageName,
      normalizeRegistryPackage(pkg),
    ]),
  );

  return {
    version: 1,
    packages,
    commands: Object.fromEntries(
      Object.entries(parsed.commands ?? {}).map(([commandName, command]) => [
        commandName,
        normalizeRegistryCommand(command),
      ]),
    ),
    aliases: parsed.aliases ?? {},
  };
};

export const writeRegistry = async (registry: Registry): Promise<void> => {
  const paths = await ensureRuntimeDirs();
  const content = `${JSON.stringify(registry, null, 2)}\n`;
  // Write to a temp file then rename so concurrent readers never see a partial write.
  const tmpFile = join(paths.homeDir, `.registry.${process.pid}.tmp`);

  await writeFile(tmpFile, content, "utf8");
  await rename(tmpFile, paths.registryFile);
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};

const normalizeRegistryPackage = (value: unknown): RegistryPackage => {
  const pkg = isRecord(value) ? value : {};
  const source = normalizeRegistryPackageSource(pkg.source);

  return {
    name: typeof pkg.name === "string" ? pkg.name : "",
    version: typeof pkg.version === "string" ? pkg.version : "",
    path: typeof pkg.path === "string" ? pkg.path : "",
    commands: Array.isArray(pkg.commands)
      ? pkg.commands.filter(
          (command): command is string => typeof command === "string",
        )
      : [],
    ...(source !== undefined ? { source } : {}),
  };
};

const normalizeRegistryPackageSource = (
  value: unknown,
): RegistryPackageSource | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.kind !== "npm" && value.kind !== "local") {
    return undefined;
  }

  if (typeof value.specifier !== "string" || value.specifier.length === 0) {
    return undefined;
  }

  return {
    kind: value.kind,
    specifier: value.specifier,
    ...(typeof value.registryUrl === "string"
      ? { registryUrl: value.registryUrl }
      : {}),
    ...(typeof value.scope === "string" ? { scope: value.scope } : {}),
    ...(typeof value.tokenEnvName === "string"
      ? { tokenEnvName: value.tokenEnvName }
      : {}),
  };
};

const normalizeRegistryCommand = (value: unknown): RegistryCommand => {
  const command = isRecord(value) ? value : {};
  const runtime = normalizeRegistryCommandRuntimeOptions(command.runtime);

  return {
    packageName:
      typeof command.packageName === "string" ? command.packageName : "",
    packageVersion:
      typeof command.packageVersion === "string" ? command.packageVersion : "",
    entry: typeof command.entry === "string" ? command.entry : "",
    description:
      typeof command.description === "string" ? command.description : "",
    ...(runtime !== undefined ? { runtime } : {}),
  };
};

const normalizeRegistryCommandRuntimeOptions = (
  value: unknown,
): RegistryCommandRuntimeOptions | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(value.repeatedFlags === "array" || value.repeatedFlags === "last"
      ? { repeatedFlags: value.repeatedFlags }
      : {}),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};
