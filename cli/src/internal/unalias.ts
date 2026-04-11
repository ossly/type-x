import type { CommandHandler } from "@type-x/types";
import { unregisterAlias } from "../alias/unregister-alias.js";

export const unalias: CommandHandler = async ({ request }) => {
  const [, aliasName] = request.argv;

  if (!aliasName) {
    throw new Error("Usage: x unalias <alias-name>");
  }

  await unregisterAlias(aliasName);

  console.log(`Removed alias ${aliasName}.`);
};
