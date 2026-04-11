import type { CommandHandler } from "@type-x/types";
import { executeResolvedCommand } from "../runtime/execute-resolved-command.js";
import { createRequest } from "../runtime/request.js";
import { resolveLocalCommand } from "../runtime/resolve-local-command.js";

export const run: CommandHandler = async ({ request }) => {
  const [, packagePath, commandName, ...commandArgv] = request.argv;

  if (!packagePath || !commandName) {
    throw new Error("Usage: x run <package-path> <command-name> [...args]");
  }

  const resolvedCommand = await resolveLocalCommand(packagePath, commandName);
  const commandRequest = createRequest([commandName, ...commandArgv]);

  await executeResolvedCommand(resolvedCommand, commandRequest);
};
