import { readFile, writeFile } from "node:fs/promises";

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

  try {
    const content = await readFile(registryFile, "utf8");
    const parsed = JSON.parse(content) as Partial<Registry>;

    const packages = Object.fromEntries(
      Object.entries(parsed.packages ?? {}).map(([packageName, pkg]) => [
        packageName,
        normalizeRegistryPackage(pkg),
      ]),
    );

    return {
      version: 1,
      packages,
      commands: parsed.commands ?? {},
      aliases: parsed.aliases ?? {},
    };
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return createEmptyRegistry();
    }

    throw error;
  }
};

export const writeRegistry = async (registry: Registry): Promise<void> => {
  const { registryFile } = await ensureRuntimeDirs();
  const content = JSON.stringify(registry, null, 2);

  await writeFile(registryFile, `${content}\n`, "utf8");
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};

const normalizeRegistryPackage = (value: unknown): RegistryPackage => {
  const pkg = isRecord(value) ? value : {};

  return {
    name: typeof pkg.name === "string" ? pkg.name : "",
    version: typeof pkg.version === "string" ? pkg.version : "",
    path: typeof pkg.path === "string" ? pkg.path : "",
    commands: Array.isArray(pkg.commands)
      ? pkg.commands.filter(
          (command): command is string => typeof command === "string",
        )
      : [],
    source: normalizeRegistryPackageSource(pkg.source),
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
    registryUrl:
      typeof value.registryUrl === "string" ? value.registryUrl : undefined,
    scope: typeof value.scope === "string" ? value.scope : undefined,
    tokenEnvName:
      typeof value.tokenEnvName === "string" ? value.tokenEnvName : undefined,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};
