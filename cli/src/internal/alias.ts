import type { CommandHandler } from "../runtime/context.js";
import { registerAlias } from "../alias/register-alias.js";
import { getShellSetupMessage } from "../shell/setup-shell.js";

export const alias: CommandHandler = async ({ request }) => {
  const [, assignment] = request.argv;

  if (!assignment) {
    throw new Error("Usage: x alias <alias-name>=<command-name>");
  }

  const separatorIndex = assignment.indexOf("=");

  if (separatorIndex <= 0 || separatorIndex === assignment.length - 1) {
    throw new Error("Usage: x alias <alias-name>=<command-name>");
  }

  const aliasName = assignment.slice(0, separatorIndex);
  const targetCommand = assignment.slice(separatorIndex + 1);

  await registerAlias(aliasName, targetCommand);

  console.log(`Created alias ${aliasName} -> ${targetCommand}.`);

  for (const line of getShellSetupMessage()) {
    console.log(line);
  }
};
