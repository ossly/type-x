import { readRegistry, writeRegistry } from "../runtime/registry.js";
import { INTERNAL_COMMAND_NAMES } from "../runtime/internal-command-names.js";
import { getAliasShimPath, hasSystemCommand, writeAliasShim } from "./alias-shim.js";

export const registerAlias = async (
  aliasName: string,
  targetCommand: string,
): Promise<void> => {
  const registry = await readRegistry();

  if (!aliasName) {
    throw new Error("Alias name cannot be empty.");
  }

  if (INTERNAL_COMMAND_NAMES.has(aliasName)) {
    throw new Error(`Alias "${aliasName}" conflicts with an internal x command.`);
  }

  if (!registry.commands[targetCommand]) {
    throw new Error(`Target command "${targetCommand}" is not installed.`);
  }

  if (registry.commands[aliasName]) {
    throw new Error(`Alias "${aliasName}" conflicts with an installed command.`);
  }

  if (registry.aliases[aliasName]) {
    throw new Error(`Alias "${aliasName}" already exists.`);
  }

  if (await hasManagedShim(aliasName)) {
    throw new Error(`Alias shim "${aliasName}" already exists in ~/.x/bin.`);
  }

  if (await hasSystemCommand(aliasName)) {
    throw new Error(`Alias "${aliasName}" conflicts with an existing command in PATH.`);
  }

  registry.aliases[aliasName] = {
    targetCommand,
  };

  await writeRegistry(registry);
  await writeAliasShim(aliasName);
};

const hasManagedShim = async (aliasName: string): Promise<boolean> => {
  const shimPath = await getAliasShimPath(aliasName);

  try {
    await import("node:fs/promises").then(({ access }) => access(shimPath));
    return true;
  } catch {
    return false;
  }
};
