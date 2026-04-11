import { pathToFileURL } from "node:url";

import type { CommandHandler } from "./context.js";

export const loadCommand = async (
  entryFile: string,
): Promise<CommandHandler> => {
  let commandModule: unknown;

  try {
    commandModule = await import(pathToFileURL(entryFile).href);
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
      `Command module "${entryFile}" must export a default function.`,
    );
  }

  return defaultExport as CommandHandler;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};
