import type { CommandHandler } from "@type-x/types";
import { installPackage } from "../install/install-package.js";

export const upgrade: CommandHandler = async ({ request, ui }) => {
  const [, rawSpecifier] = request.argv;

  if (!rawSpecifier) {
    throw new Error("Usage: x upgrade <package-name-or-path>");
  }

  const task = ui.task(`Upgrading ${rawSpecifier}`);

  try {
    const manifest = await installPackage({
      rawSpecifier,
      cwd: request.pwd,
      mode: "upgrade",
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
