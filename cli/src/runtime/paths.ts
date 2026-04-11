import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface RuntimePaths {
  homeDir: string;
  registryFile: string;
  packagesDir: string;
  storesDir: string;
  binDir: string;
  tmpDir: string;
}

export const getRuntimePaths = (): RuntimePaths => {
  const homeDir = process.env.X_HOME ?? join(homedir(), '.x');

  return {
    homeDir,
    registryFile: join(homeDir, 'registry.json'),
    packagesDir: join(homeDir, 'packages'),
    storesDir: join(homeDir, 'stores'),
    binDir: join(homeDir, 'bin'),
    tmpDir: join(homeDir, 'tmp'),
  };
};

export const ensureRuntimeDirs = async (): Promise<RuntimePaths> => {
  const paths = getRuntimePaths();

  await mkdir(paths.homeDir, { recursive: true });
  await mkdir(paths.packagesDir, { recursive: true });
  await mkdir(paths.storesDir, { recursive: true });
  await mkdir(paths.binDir, { recursive: true });
  await mkdir(paths.tmpDir, { recursive: true });

  return paths;
};
