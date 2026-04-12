import type { CommandStore } from "@type-x/types";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ensureRuntimeDirs } from "./paths.js";

export const createCommandStore = <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
  homeDir: string,
): CommandStore<TStore> => {
  return {
    get: async (key) => {
      const state = await readStore<TStore>(packageName, homeDir);
      return state[key];
    },
    set: async (key, value) => {
      const state = await readStore<TStore>(packageName, homeDir);
      await writeStore(packageName, homeDir, {
        ...state,
        [key]: value,
      });
    },
    delete: async (key) => {
      const state = await readStore<TStore>(packageName, homeDir);
      const nextState: Record<string, unknown> = { ...state };

      delete nextState[String(key)];
      await writeStore(packageName, homeDir, nextState);
    },
    has: async (key) => {
      const state = await readStore<TStore>(packageName, homeDir);
      return key in state;
    },
    all: async () => {
      return readStore<TStore>(packageName, homeDir);
    },
    clear: async () => {
      await writeStore(packageName, homeDir, {});
    },
  };
};

export const getStoreFilePath = async (
  packageName: string,
  homeDir: string,
): Promise<string> => {
  const { storesDir } = await ensureRuntimeDirs(homeDir);

  return join(storesDir, `${sanitizeSegment(packageName)}.json`);
};

const readStore = async <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
  homeDir: string,
): Promise<Partial<TStore>> => {
  const storeFilePath = await getStoreFilePath(packageName, homeDir);

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
  homeDir: string,
  state: Record<string, unknown>,
): Promise<void> => {
  const storeFilePath = await getStoreFilePath(packageName, homeDir);
  const content = JSON.stringify(state, null, 2);

  await writeFile(storeFilePath, `${content}\n`, "utf8");
};

const sanitizeSegment = (value: string): string => {
  return value.replaceAll("/", "__");
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
