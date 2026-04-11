import { readFile } from "node:fs/promises";

import type { CommandHandler } from "@type-x/types";

export const version: CommandHandler = async () => {
  console.log(await readCliPackageVersion());
};

const readCliPackageVersion = async (): Promise<string> => {
  const packageJsonUrl = new URL("../../../package.json", import.meta.url);
  const content = await readFile(packageJsonUrl, "utf8");
  const packageJson = JSON.parse(content) as {
    version?: unknown;
  };

  if (
    typeof packageJson.version !== "string" ||
    packageJson.version.trim().length === 0
  ) {
    throw new Error(
      `Invalid CLI package manifest "${packageJsonUrl.pathname}": expected "version" to be a non-empty string.`,
    );
  }

  return packageJson.version;
};
