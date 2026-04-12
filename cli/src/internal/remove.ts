import type { CommandHandler } from "@type-x/types";
import { removePackage } from "../install/remove-package.js";

export const remove: CommandHandler = async ({ request, ui }) => {
  const [packageName] = request.argv;

  if (!packageName) {
    throw new Error("Usage: x remove <package-name>");
  }

  const task = ui.task(`Removing ${packageName}`);

  try {
    await removePackage(packageName);
    task.done(`Removed ${packageName}`);
    console.log(`Removed ${packageName}.`);
  } catch (error: unknown) {
    task.fail(`Failed to remove ${packageName}`);
    throw error;
  }
};
