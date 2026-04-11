import { createCommandContext } from "./context.js";
import { invokeCommand } from "./invoke-command.js";
import { loadCommand } from "./load-command.js";
import type { CommandRequest } from "./request.js";
import type { ResolvedCommand } from "./resolve-command.js";

export const executeResolvedCommand = async (
  resolvedCommand: ResolvedCommand,
  request: CommandRequest,
): Promise<void> => {
  const handler = await loadCommand(resolvedCommand.entryFile);
  const context = createCommandContext(
    {
      name: resolvedCommand.commandName,
      packageName: resolvedCommand.packageName,
      version: resolvedCommand.packageVersion,
    },
    request,
  );

  await invokeCommand(handler, context);
};
