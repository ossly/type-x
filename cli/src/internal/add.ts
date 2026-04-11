import type { CommandHandler } from "../runtime/context.js";
import { installPackage } from "../install/install-package.js";
import { printCommandTable, type CommandRow } from "./command-table.js";

export const add: CommandHandler = async ({ request }) => {
  const [, rawSpecifier] = request.argv;

  if (!rawSpecifier) {
    throw new Error("Usage: x add <package-name-or-path>");
  }

  const manifest = await installPackage({
    rawSpecifier,
    cwd: request.pwd,
    mode: "add",
  });

  console.log(
    `Installed ${manifest.packageName}@${manifest.packageVersion} with ${Object.keys(manifest.commands).length} command(s).`,
  );

  console.log("");

  const rows: CommandRow[] = Object.entries(manifest.commands)
    .map(([command, entry]) => ({
      command,
      packageName: manifest.packageName,
      version: manifest.packageVersion,
      description: entry.description,
    }))
    .sort((left, right) => left.command.localeCompare(right.command));

  printCommandTable(rows);
};
