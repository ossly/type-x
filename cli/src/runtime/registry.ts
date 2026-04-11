import { readFile, writeFile } from "node:fs/promises";

import { ensureRuntimeDirs, getRuntimePaths } from "./paths.js";

export interface RegistryPackage {
  name: string;
  version: string;
  path: string;
  commands: string[];
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

    return {
      version: 1,
      packages: parsed.packages ?? {},
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
