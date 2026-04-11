import type { CommandHandler } from "@type-x/types";
import { installPackage } from "../install/install-package.js";

export const upgrade: CommandHandler = async ({ request }) => {
  const [, rawSpecifier] = request.argv;

  if (!rawSpecifier) {
    throw new Error("Usage: x upgrade <package-name-or-path>");
  }

  const manifest = await installPackage({
    rawSpecifier,
    cwd: request.pwd,
    mode: "upgrade",
  });

  console.log(
    `Upgraded ${manifest.packageName} to ${manifest.packageVersion} with ${Object.keys(manifest.commands).length} command(s).`,
  );
};
