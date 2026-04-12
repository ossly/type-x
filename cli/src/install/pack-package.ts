import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ensureRuntimeDirs } from "../runtime/paths.js";
import type { PackageSpec } from "./package-spec.js";

const execFileAsync = promisify(execFile);

export interface PackedPackage {
  specifier: string;
  tempDir: string;
  tarballFile: string;
}

export const packPackage = async (
  spec: PackageSpec,
): Promise<PackedPackage> => {
  const { tmpDir } = await ensureRuntimeDirs();
  const tempDir = await mkdtemp(join(tmpDir, "pack-"));
  const npmCacheDir = join(tempDir, "npm-cache");

  let stdout: string;

  try {
    const result = await execFileAsync(
      "npm",
      ["pack", spec.source, "--silent"],
      {
        cwd: tempDir,
        env: {
          ...process.env,
          npm_config_cache: npmCacheDir,
        },
      },
    );

    stdout = result.stdout;
  } catch (error: unknown) {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    throw new Error(
      `Failed to pack package "${spec.raw}": ${getErrorMessage(error)}`,
    );
  }

  const tarballName = stdout.trim().split("\n").filter(Boolean).at(-1);

  if (!tarballName) {
    throw new Error(`Failed to determine tarball name for "${spec.raw}".`);
  }

  return {
    specifier: spec.raw,
    tempDir,
    tarballFile: resolve(tempDir, tarballName),
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
