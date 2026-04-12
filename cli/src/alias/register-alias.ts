import { readRegistry, writeRegistry } from "../runtime/registry.js";
import { INTERNAL_COMMAND_NAME_SET } from "../runtime/internal-command-names.js";
import {
  getAliasShimPath,
  hasSystemCommand,
  removeAliasShim,
  writeAliasShim,
} from "./alias-shim.js";

export const registerAlias = async (
  aliasName: string,
  targetCommand: string,
): Promise<void> => {
  const registry = await readRegistry();
  const shimPath = await getAliasShimPath(aliasName);

  if (!aliasName) {
    throw new Error("Alias name cannot be empty.");
  }

  if (INTERNAL_COMMAND_NAME_SET.has(aliasName)) {
    throw new Error(
      `Alias "${aliasName}" conflicts with an internal x command.`,
    );
  }

  if (!registry.commands[targetCommand]) {
    throw new Error(`Target command "${targetCommand}" is not installed.`);
  }

  if (registry.aliases[aliasName]) {
    throw new Error(`Alias "${aliasName}" already exists.`);
  }

  if (await hasManagedShim(shimPath)) {
    throw new Error(`Alias shim "${aliasName}" already exists at ${shimPath}.`);
  }

  if (await hasSystemCommand(aliasName)) {
    throw new Error(
      `Alias "${aliasName}" conflicts with an existing command in PATH.`,
    );
  }

  registry.aliases[aliasName] = {
    targetCommand,
  };

  await writeAliasShim(aliasName);

  try {
    await writeRegistry(registry);
  } catch (error: unknown) {
    await removeAliasShim(aliasName).catch(() => undefined);
    throw error;
  }
};

const hasManagedShim = async (shimPath: string): Promise<boolean> => {
  try {
    await import("node:fs/promises").then(({ access }) => access(shimPath));
    return true;
  } catch {
    return false;
  }
};
