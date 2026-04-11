import { createCommandContext } from "./context.js";
import type { CommandMetadata, CommandHandler } from "./context.js";
import { invokeCommand } from "./invoke-command.js";
import type { CommandRequest } from "./request.js";

export const executeCommand = async ({
  command,
  handler,
  request,
}: {
  command: CommandMetadata;
  handler: CommandHandler;
  request: CommandRequest;
}): Promise<void> => {
  const context = createCommandContext(command, request);

  await invokeCommand(handler, context);
};
