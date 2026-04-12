import type { CommandHandler, CommandMetadata } from "@type-x/types";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";

import { createCommandContext } from "./context.js";
import { invokeCommand } from "./invoke-command.js";
import { createRequest } from "./request.js";

export interface CommandRuntimeOptions {
  homeDir?: string;
}

export interface InitCliOptions {
  name?: string;
  packageName?: string;
  version?: string;
  argv?: string[];
  cwd?: string;
  env?: Record<string, string | undefined>;
  entryFilePath?: string;
  runtime?: CommandRuntimeOptions;
}

interface PackageMetadata {
  packageRoot: string;
  packageName?: string;
  version?: string;
  bin?: unknown;
}

export const initCli = <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  handler: CommandHandler<TStore>,
  options: InitCliOptions = {},
): void => {
  void runCommand(handler, options).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
};

const runCommand = async <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  handler: CommandHandler<TStore>,
  options: InitCliOptions,
): Promise<void> => {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const argv = options.argv ?? process.argv.slice(2);
  const entryFilePath = resolve(options.entryFilePath ?? process.argv[1] ?? cwd);
  const packageMetadata = await readPackageMetadata(entryFilePath, cwd);
  const command = resolveCommandMetadata(options, packageMetadata, entryFilePath);
  const runtimeHomeDir =
    options.runtime?.homeDir ??
    getDefaultRuntimeHomeDir(command.packageName);
  const request = createRequest(argv, {
    invocationArgv: [command.name, ...argv],
    cwd,
    env,
  });
  const context = createCommandContext<TStore>(command, request, runtimeHomeDir);

  await invokeCommand(handler, context);
};

const readPackageMetadata = async (
  entryFilePath: string,
  cwd: string,
): Promise<PackageMetadata> => {
  const searchRoots = [dirname(entryFilePath), cwd];

  for (const searchRoot of searchRoots) {
    const packageRoot = await findPackageRoot(searchRoot);

    if (!packageRoot) {
      continue;
    }

    const packageJsonPath = join(packageRoot, "package.json");
    const content = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(content) as {
      name?: unknown;
      version?: unknown;
      bin?: unknown;
    };

    return {
      packageRoot,
      packageName:
        typeof parsed.name === "string" && parsed.name.length > 0
          ? parsed.name
          : undefined,
      version:
        typeof parsed.version === "string" && parsed.version.length > 0
          ? parsed.version
          : undefined,
      bin: parsed.bin,
    };
  }

  return {
    packageRoot: cwd,
  };
};

const resolveCommandMetadata = (
  options: InitCliOptions,
  packageMetadata: PackageMetadata,
  entryFilePath: string,
): CommandMetadata => {
  const packageName = options.packageName ?? packageMetadata.packageName ?? "unknown-package";
  const version = options.version ?? packageMetadata.version ?? "0.0.0";
  const name =
    options.name ??
    inferCommandName(packageMetadata, entryFilePath) ??
    basename(entryFilePath, extname(entryFilePath));

  return {
    name,
    packageName,
    version,
  };
};

const inferCommandName = (
  packageMetadata: PackageMetadata,
  entryFilePath: string,
): string | undefined => {
  const resolvedEntryFilePath = resolve(entryFilePath);
  const { bin, packageName, packageRoot } = packageMetadata;

  if (typeof bin === "string") {
    return packageName ? stripPackageScope(packageName) : undefined;
  }

  if (bin && typeof bin === "object") {
    for (const [name, relativePath] of Object.entries(bin)) {
      if (typeof relativePath !== "string") {
        continue;
      }

      if (resolve(packageRoot, relativePath) === resolvedEntryFilePath) {
        return name;
      }
    }
  }

  return packageName ? stripPackageScope(packageName) : undefined;
};

const stripPackageScope = (name: string): string => {
  const slashIndex = name.lastIndexOf("/");
  return slashIndex >= 0 ? name.slice(slashIndex + 1) : name;
};

const getDefaultRuntimeHomeDir = (
  packageName: string,
): string => {
  const packageKey = sanitizePackageName(packageName);

  return join(homedir(), ".type-x", packageKey);
};

const sanitizePackageName = (packageName: string): string => {
  return packageName.replace(/^@/, "").replaceAll("/", "__");
};

const findPackageRoot = async (startDir: string): Promise<string | undefined> => {
  let currentDir = resolve(startDir);

  while (true) {
    const packageJsonPath = join(currentDir, "package.json");

    try {
      await readFile(packageJsonPath, "utf8");
      return currentDir;
    } catch (error: unknown) {
      if (!isMissingFileError(error)) {
        throw error;
      }
    }

    const parentDir = dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
