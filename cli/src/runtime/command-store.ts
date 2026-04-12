import type { CommandStore } from "@type-x/types";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ensureRuntimeDirs } from "./paths.js";

export const createCommandStore = <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
): CommandStore<TStore> => {
  return {
    get: async (key) => {
      const state = await readStore<TStore>(packageName);
      return state[key];
    },
    set: async (key, value) => {
      const state = await readStore<TStore>(packageName);
      await writeStore(packageName, {
        ...state,
        [key]: value,
      });
    },
    delete: async (key) => {
      const state = await readStore<TStore>(packageName);
      const nextState: Record<string, unknown> = { ...state };

      delete nextState[String(key)];
      await writeStore(packageName, nextState);
    },
    has: async (key) => {
      const state = await readStore<TStore>(packageName);
      return key in state;
    },
    all: async () => {
      return readStore<TStore>(packageName);
    },
    clear: async () => {
      await writeStore(packageName, {});
    },
  };
};

export const getStoreFilePath = async (
  packageName: string,
): Promise<string> => {
  const { storesDir } = await ensureRuntimeDirs();

  return join(storesDir, `${sanitizeSegment(packageName)}.json`);
};

const readStore = async <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
): Promise<Partial<TStore>> => {
  const storeFilePath = await getStoreFilePath(packageName);

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
  state: Record<string, unknown>,
): Promise<void> => {
  const storeFilePath = await getStoreFilePath(packageName);
  const content = JSON.stringify(state, null, 2);

  await writeFile(storeFilePath, `${content}\n`, "utf8");
};

const sanitizeSegment = (value: string): string => {
  return value.replaceAll("/", "__");
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
