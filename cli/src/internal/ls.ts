import type { CommandHandler } from "../runtime/context.js";
import { readRegistry } from "../runtime/registry.js";

interface CommandRow {
  command: string;
  packageName: string;
  version: string;
  description: string;
}

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

  if (rows.length === 0) {
    console.log("No installed commands.");
    return;
  }

  const commandWidth = getColumnWidth(
    "COMMAND",
    rows.map((row) => row.command),
  );
  const packageWidth = getColumnWidth(
    "PACKAGE",
    rows.map((row) => row.packageName),
  );
  const versionWidth = getColumnWidth(
    "VERSION",
    rows.map((row) => row.version),
  );

  console.log(
    [
      "COMMAND".padEnd(commandWidth),
      "PACKAGE".padEnd(packageWidth),
      "VERSION".padEnd(versionWidth),
      "DESCRIPTION",
    ].join("  "),
  );

  for (const row of rows) {
    console.log(
      [
        row.command.padEnd(commandWidth),
        row.packageName.padEnd(packageWidth),
        row.version.padEnd(versionWidth),
        row.description,
      ].join("  "),
    );
  }
};

const getColumnWidth = (header: string, values: string[]): number => {
  return values.reduce(
    (width, value) => Math.max(width, value.length),
    header.length,
  );
};
