import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface RuntimePaths {
  homeDir: string;
  storesDir: string;
  tmpDir: string;
}

export const getRuntimePaths = (homeDir: string): RuntimePaths => {
  return {
    homeDir,
    storesDir: join(homeDir, "stores"),
    tmpDir: join(homeDir, "tmp"),
  };
};

export const ensureRuntimeDirs = async (
  homeDir: string,
): Promise<RuntimePaths> => {
  const paths = getRuntimePaths(homeDir);

  await mkdir(paths.homeDir, { recursive: true });
  await mkdir(paths.storesDir, { recursive: true });
  await mkdir(paths.tmpDir, { recursive: true });

  return paths;
};
