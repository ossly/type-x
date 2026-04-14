import type { CommandHandler } from "@type-x/types";
import { installPackage } from "../install/install-package.js";
import { readInstallSourceOptions } from "../install/source-options.js";

export const upgrade: CommandHandler = async ({ request, ui }) => {
  const [rawSpecifier] = request.args;

  if (!rawSpecifier) {
    throw new Error(
      "Usage: x upgrade <package-name-or-path> [--registry <url>] [--scope <scope>] [--token-env <name>] [--token <value>]",
    );
  }

  const task = ui.task(`Upgrading ${rawSpecifier}`);

  try {
    const manifest = await installPackage({
      rawSpecifier,
      cwd: request.pwd,
      mode: "upgrade",
      options: readInstallSourceOptions(request),
      onStatus: (message) => {
        task.update(`${message}: ${rawSpecifier}`);
      },
    });

    task.done(`Upgraded ${manifest.packageName} to ${manifest.packageVersion}`);

    console.log(
      `Upgraded ${manifest.packageName} to ${manifest.packageVersion} with ${Object.keys(manifest.commands).length} command(s).`,
    );
  } catch (error: unknown) {
    task.fail(`Failed to upgrade ${rawSpecifier}`);
    throw error;
  }
};
