import { removeAliasShim } from "./alias-shim.js";
import { readRegistry, writeRegistry } from "../runtime/registry.js";

export const unregisterAlias = async (aliasName: string): Promise<void> => {
  const registry = await readRegistry();

  if (!registry.aliases[aliasName]) {
    throw new Error(`Alias "${aliasName}" does not exist.`);
  }

  delete registry.aliases[aliasName];

  await writeRegistry(registry);
  await removeAliasShim(aliasName);
};
