import type {
  CommandHandler,
  CommandMetadata,
  CommandRequest,
} from "@type-x/types";
import { createCommandContext } from "./context.js";
import { invokeCommand } from "./invoke-command.js";

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
