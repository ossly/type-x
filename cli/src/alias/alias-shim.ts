import { access, chmod, rm, writeFile } from "node:fs/promises";
import { delimiter } from "node:path";
import { join } from "node:path";

import { ensureRuntimeDirs } from "../runtime/paths.js";

export const getAliasShimPath = async (aliasName: string): Promise<string> => {
  const { binDir } = await ensureRuntimeDirs();

  return join(binDir, aliasName);
};

export const writeAliasShim = async (aliasName: string): Promise<string> => {
  const shimPath = await getAliasShimPath(aliasName);
  const content = [
    "#!/usr/bin/env sh",
    `x run-alias ${quoteShellArgument(aliasName)} "$@"`,
    "",
  ].join("\n");

  await writeFile(shimPath, content, "utf8");
  await chmod(shimPath, 0o755);

  return shimPath;
};

export const removeAliasShim = async (aliasName: string): Promise<void> => {
  const shimPath = await getAliasShimPath(aliasName);

  await rm(shimPath, { force: true });
};

export const hasSystemCommand = async (name: string): Promise<boolean> => {
  const pathValue = process.env.PATH;

  if (!pathValue) {
    return false;
  }

  for (const directory of pathValue.split(delimiter)) {
    if (!directory) {
      continue;
    }

    try {
      await access(join(directory, name));
      return true;
    } catch {
      continue;
    }
  }

  return false;
};

const quoteShellArgument = (value: string): string => {
  return `'${value.replaceAll("'", `'\\''`)}'`;
};
