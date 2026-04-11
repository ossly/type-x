import { createCommandContext } from "./context.js";
import type { CommandHandler } from "./context.js";
import type { CommandRequest } from "./request.js";

export const invokeCommand = async (
  commandName: string,
  handler: CommandHandler,
  request: CommandRequest,
): Promise<void> => {
  const context = createCommandContext(commandName, request);

  await handler(context);
};
