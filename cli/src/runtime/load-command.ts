import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { CommandHandler } from "@type-x/types";

export interface LoadCommandOptions {
  rootDir?: string;
}

export const loadCommand = async (
  entryFile: string,
  options: LoadCommandOptions = {},
): Promise<CommandHandler> => {
  const resolvedEntry = resolve(entryFile);

  if (
    options.rootDir !== undefined &&
    !isPathInsideDirectory(resolvedEntry, options.rootDir)
  ) {
    throw new Error(
      `Refusing to load command module outside of package directory: "${entryFile}"`,
    );
  }

  let commandModule: unknown;

  try {
    commandModule = await import(pathToFileURL(resolvedEntry).href);
  } catch (error: unknown) {
    throw new Error(
      `Failed to load command module "${entryFile}": ${getErrorMessage(error)}`,
    );
  }

  const defaultExport =
    commandModule &&
    typeof commandModule === "object" &&
    "default" in commandModule
      ? commandModule.default
      : undefined;

  if (typeof defaultExport !== "function") {
    throw new Error(
      `Command module "${entryFile}" must export a default function, received ${describeExportType(defaultExport)}.`,
    );
  }

  return defaultExport as CommandHandler;
};

const isPathInsideDirectory = (
  filePath: string,
  directory: string,
): boolean => {
  const relativePath = relative(resolve(directory), filePath);
  return (
    relativePath.length > 0 &&
    !relativePath.startsWith("..") &&
    !relativePath.includes(":")
  );
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

const describeExportType = (value: unknown): string => {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
};
