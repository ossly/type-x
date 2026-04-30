import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { CommandHandler } from "@type-x/types";
import { getRuntimePaths } from "./paths.js";

export const loadCommand = async (
  entryFile: string,
): Promise<CommandHandler> => {
  const { packagesDir } = getRuntimePaths();
  const resolvedEntry = resolve(entryFile);

  if (!resolvedEntry.startsWith(packagesDir + "/")) {
    throw new Error(
      `Refusing to load command module outside of packages directory: "${entryFile}"`,
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
