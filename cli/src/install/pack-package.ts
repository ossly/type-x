import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ensureRuntimeDirs } from "../runtime/paths.js";
import type { InstallSourceOptions } from "./source-options.js";
import type { PackageSpec } from "./package-spec.js";

const execFileAsync = promisify(execFile);

export interface PackedPackage {
  specifier: string;
  tempDir: string;
  tarballFile: string;
}

export const packPackage = async (
  spec: PackageSpec,
  options: InstallSourceOptions = {},
): Promise<PackedPackage> => {
  const { tmpDir } = await ensureRuntimeDirs();
  const tempDir = await mkdtemp(join(tmpDir, "pack-"));
  const npmCacheDir = join(tempDir, "npm-cache");
  const npmUserConfigFile = join(tempDir, ".npmrc");

  let stdout: string;

  try {
    await writeNpmUserConfig(npmUserConfigFile, options);

    const result = await execFileAsync(
      "npm",
      ["pack", spec.source, "--silent"],
      {
        cwd: tempDir,
        env: {
          ...process.env,
          npm_config_cache: npmCacheDir,
          npm_config_userconfig: npmUserConfigFile,
          ...(options.registryUrl
            ? { npm_config_registry: options.registryUrl }
            : {}),
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

const writeNpmUserConfig = async (
  npmUserConfigFile: string,
  options: InstallSourceOptions,
): Promise<void> => {
  const lines: string[] = [];
  const token = resolveToken(options);
  const registryUrl = normalizeRegistryUrl(options.registryUrl);

  if (registryUrl && options.scope) {
    lines.push(`${options.scope}:registry=${registryUrl}`);
  }

  if (registryUrl && token) {
    const authKey = getRegistryAuthKey(registryUrl);
    lines.push(`${authKey}:_authToken=${token}`);
  }

  const content = lines.length > 0 ? `${lines.join("\n")}\n` : "";
  await writeFile(npmUserConfigFile, content, "utf8");
};

const resolveToken = (options: InstallSourceOptions): string | undefined => {
  if (options.token) {
    return options.token;
  }

  if (options.tokenEnvName) {
    return process.env[options.tokenEnvName];
  }

  return undefined;
};

const normalizeRegistryUrl = (
  value: string | undefined,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return value.endsWith("/") ? value : `${value}/`;
};

const getRegistryAuthKey = (registryUrl: string): string => {
  const normalizedUrl = new URL(registryUrl);
  return `//${normalizedUrl.host}${normalizedUrl.pathname}`;
};
