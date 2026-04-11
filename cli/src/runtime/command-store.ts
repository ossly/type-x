import type { CommandStore } from "@type-x/types";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ensureRuntimeDirs } from "./paths.js";

export const createCommandStore = <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
  commandName: string,
): CommandStore<TStore> => {
  return {
    get: async (key) => {
      const state = await readStore<TStore>(packageName, commandName);
      return state[key];
    },
    set: async (key, value) => {
      const state = await readStore<TStore>(packageName, commandName);
      await writeStore(packageName, commandName, {
        ...state,
        [key]: value,
      });
    },
    delete: async (key) => {
      const state = await readStore<TStore>(packageName, commandName);
      const nextState: Record<string, unknown> = { ...state };

      delete nextState[String(key)];
      await writeStore(packageName, commandName, nextState);
    },
    has: async (key) => {
      const state = await readStore<TStore>(packageName, commandName);
      return key in state;
    },
    all: async () => {
      return readStore<TStore>(packageName, commandName);
    },
    clear: async () => {
      await writeStore(packageName, commandName, {});
    },
  };
};

export const getStoreFilePath = async (
  packageName: string,
  commandName: string,
): Promise<string> => {
  const { storesDir } = await ensureRuntimeDirs();

  return join(
    storesDir,
    `${sanitizeSegment(packageName)}__${sanitizeSegment(commandName)}.json`,
  );
};

const readStore = async <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
  commandName: string,
): Promise<Partial<TStore>> => {
  const storeFilePath = await getStoreFilePath(packageName, commandName);

  try {
    const content = await readFile(storeFilePath, "utf8");
    return JSON.parse(content) as Partial<TStore>;
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return {};
    }

    throw error;
  }
};

const writeStore = async (
  packageName: string,
  commandName: string,
  state: Record<string, unknown>,
): Promise<void> => {
  const storeFilePath = await getStoreFilePath(packageName, commandName);
  const content = JSON.stringify(state, null, 2);

  await writeFile(storeFilePath, `${content}\n`, "utf8");
};

const sanitizeSegment = (value: string): string => {
  return value.replaceAll("/", "__");
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
