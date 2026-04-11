import type { CommandHandler } from "@type-x/types";
import { readRegistry } from "../runtime/registry.js";
import { printCommandTable, type CommandRow } from "./command-table.js";

export const listCommands: CommandHandler = async () => {
  const registry = await readRegistry();

  const rows: CommandRow[] = Object.entries(registry.commands)
    .map(([command, entry]) => ({
      command,
      packageName: entry.packageName,
      version: entry.packageVersion,
      description: entry.description,
    }))
    .sort((left, right) => left.command.localeCompare(right.command));

  printCommandTable(rows);
};
