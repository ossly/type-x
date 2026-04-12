import { removeAliasShim, writeAliasShim } from "./alias-shim.js";
import { readRegistry, writeRegistry } from "../runtime/registry.js";

export const unregisterAlias = async (aliasName: string): Promise<void> => {
  const registry = await readRegistry();
  const existingAlias = registry.aliases[aliasName];

  if (!existingAlias) {
    throw new Error(`Alias "${aliasName}" does not exist.`);
  }

  delete registry.aliases[aliasName];

  await removeAliasShim(aliasName);

  try {
    await writeRegistry(registry);
  } catch (error: unknown) {
    await writeAliasShim(aliasName).catch(() => undefined);
    registry.aliases[aliasName] = existingAlias;
    throw error;
  }
};
