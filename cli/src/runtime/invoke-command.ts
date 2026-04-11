import type { CommandContext, CommandHandler } from "./context.js";

export const invokeCommand = async (
  handler: CommandHandler,
  context: CommandContext,
): Promise<void> => {
  await handler(context);
};
