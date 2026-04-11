import type { CommandHandler } from "@type-x/types";
import { installPackage } from "../install/install-package.js";
import { printCommandTable, type CommandRow } from "./command-table.js";

export const add: CommandHandler = async ({ request, ui }) => {
  const [, rawSpecifier] = request.argv;

  if (!rawSpecifier) {
    throw new Error("Usage: x add <package-name-or-path>");
  }

  const task = ui.task(`Installing ${rawSpecifier}`);

  try {
    const manifest = await installPackage({
      rawSpecifier,
      cwd: request.pwd,
      mode: "add",
      onStatus: (message) => {
        task.update(`${message}: ${rawSpecifier}`);
      },
    });

    task.done(`Installed ${manifest.packageName}@${manifest.packageVersion}`);

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
  } catch (error: unknown) {
    task.fail(`Failed to install ${rawSpecifier}`);
    throw error;
  }
};
