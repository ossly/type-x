import { createRequest, type RepeatedFlagsMode } from "@type-x/runtime";
import type { CommandHandler } from "@type-x/types";
import { executeResolvedCommand } from "../runtime/execute-resolved-command.js";
import { resolveLocalCommand } from "../runtime/resolve-local-command.js";

export const run: CommandHandler = async ({ request }) => {
  const [packagePath, commandName, ...commandArgv] = request.argv;

  if (!packagePath || !commandName) {
    throw new Error("Usage: x run <package-path> <command-name> [...args]");
  }

  const resolvedCommand = await resolveLocalCommand(packagePath, commandName);
  const commandRequest = createRequest(commandArgv, {
    invocationArgv: [commandName, ...commandArgv],
    ...requestRepeatedFlagsOption(resolvedCommand.runtime?.repeatedFlags),
  });

  await executeResolvedCommand(resolvedCommand, commandRequest);
};

const requestRepeatedFlagsOption = (
  repeatedFlags: RepeatedFlagsMode | undefined,
): { repeatedFlags?: RepeatedFlagsMode } => {
  return repeatedFlags !== undefined ? { repeatedFlags } : {};
};
