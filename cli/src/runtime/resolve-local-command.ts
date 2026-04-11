import { resolve } from "node:path";

import { getManifestCommand, readPackageManifest } from "./manifest.js";
import type { ResolvedCommand } from "./resolve-command.js";

export const resolveLocalCommand = async (
  packagePath: string,
  commandName: string,
): Promise<ResolvedCommand> => {
  const manifest = await readPackageManifest(packagePath);
  const command = getManifestCommand(manifest, commandName);

  return {
    commandName,
    packageName: manifest.packageName,
    packageVersion: manifest.packageVersion,
    packagePath: manifest.packagePath,
    entry: command.entry,
    entryFile: resolve(manifest.packagePath, command.entry),
    description: command.description,
  };
};
