import type { CommandRequest } from "@type-x/types";
import { executeCommand } from "./execute-command.js";
import { loadCommand } from "./load-command.js";
import type { ResolvedCommand } from "./resolve-command.js";

export const executeResolvedCommand = async (
  resolvedCommand: ResolvedCommand,
  request: CommandRequest,
  aliasUsed?: string,
): Promise<void> => {
  const handler = await loadCommand(resolvedCommand.entryFile);

  await executeCommand({
    command: {
      name: resolvedCommand.commandName,
      packageName: resolvedCommand.packageName,
      version: resolvedCommand.packageVersion,
      ...(aliasUsed !== undefined ? { aliasUsed } : {}),
    },
    handler,
    request,
  });
};
