import type { CommandHandler } from "../runtime/context.js";
import { readRegistry } from "../runtime/registry.js";
import { printAliasTable, type AliasRow } from "./alias-table.js";

export const listAliases: CommandHandler = async () => {
  const registry = await readRegistry();

  const rows: AliasRow[] = Object.entries(registry.aliases)
    .map(([alias, entry]) => ({
      alias,
      command: entry.targetCommand,
    }))
    .sort((left, right) => left.alias.localeCompare(right.alias));

  printAliasTable(rows);
};
