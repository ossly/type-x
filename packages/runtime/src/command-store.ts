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
  const get = async (key: string): Promise<unknown | undefined> => {
    const state = await readStore<TStore>(packageName, homeDir);
    return readPath(state, key);
  };

  const set = async (key: string, value: unknown): Promise<void> => {
    const state = await readStore<TStore>(packageName, homeDir);
    await writeStore(packageName, homeDir, writePath(state, key, value));
  };

  const deleteValue = async (key: string): Promise<void> => {
    const state = await readStore<TStore>(packageName, homeDir);
    const nextState = deletePath(state, key);
    await writeStore(packageName, homeDir, nextState);
  };

  const has = async (key: string): Promise<boolean> => {
    const state = await readStore<TStore>(packageName, homeDir);
    return readPath(state, key) !== undefined;
  };

  const store = {
    get,
    set,
    delete: deleteValue,
    has,
    all: async () => {
      return readStore<TStore>(packageName, homeDir);
    },
    clear: async () => {
      await writeStore(packageName, homeDir, {});
    },
  };

  return store as CommandStore<TStore>;
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

const readPath = (
  state: Record<string, unknown>,
  path: string,
): unknown | undefined => {
  if (Object.hasOwn(state, path)) {
    return state[path];
  }

  const segments = splitPath(path);
  let current: unknown = state;

  for (const segment of segments) {
    if (!isRecord(current) || !Object.hasOwn(current, segment)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
};

const writePath = (
  state: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> => {
  if (Object.hasOwn(state, path)) {
    return {
      ...state,
      [path]: value,
    };
  }

  const segments = splitPath(path);

  if (segments.length === 1) {
    return {
      ...state,
      [path]: value,
    };
  }

  const nextState = { ...state };
  let current: Record<string, unknown> = nextState;

  for (const segment of segments.slice(0, -1)) {
    const currentValue = current[segment];
    const nextValue = isRecord(currentValue) ? { ...currentValue } : {};
    current[segment] = nextValue;
    current = nextValue;
  }

  current[segments.at(-1)!] = value;
  return nextState;
};

const deletePath = (
  state: Record<string, unknown>,
  path: string,
): Record<string, unknown> => {
  const nextState = { ...state };

  if (Object.hasOwn(nextState, path)) {
    delete nextState[path];
    return nextState;
  }

  const segments = splitPath(path);

  if (segments.length === 1) {
    delete nextState[path];
    return nextState;
  }

  let current: Record<string, unknown> = nextState;

  for (const segment of segments.slice(0, -1)) {
    const currentValue = current[segment];

    if (!isRecord(currentValue)) {
      return nextState;
    }

    const nextValue = { ...currentValue };
    current[segment] = nextValue;
    current = nextValue;
  }

  delete current[segments.at(-1)!];
  return nextState;
};

const splitPath = (path: string): string[] => {
  return path.split(".").filter((segment) => segment.length > 0);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const sanitizeSegment = (value: string): string => {
  return value.replaceAll("/", "__");
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
