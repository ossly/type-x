import {
  createCommandStore as createBaseCommandStore,
  getStoreFilePath as getBaseStoreFilePath,
} from "@type-x/runtime";
import type { CommandStore } from "@type-x/types";
import { getRuntimePaths } from "./paths.js";

export const createCommandStore = <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  packageName: string,
): CommandStore<TStore> => {
  const homeDir = getCliRuntimeHomeDir();
  return createBaseCommandStore<TStore>(packageName, homeDir);
};

export const getStoreFilePath = async (
  packageName: string,
): Promise<string> => {
  const homeDir = getCliRuntimeHomeDir();
  return getBaseStoreFilePath(packageName, homeDir);
};

const getCliRuntimeHomeDir = (): string => {
  return getRuntimePaths().homeDir;
};
