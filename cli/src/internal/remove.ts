import type { CommandHandler } from "@type-x/types";
import { removePackage } from "../install/remove-package.js";

export const remove: CommandHandler = async ({ request }) => {
  const [, packageName] = request.argv;

  if (!packageName) {
    throw new Error("Usage: x remove <package-name>");
  }

  await removePackage(packageName);

  console.log(`Removed ${packageName}.`);
};
