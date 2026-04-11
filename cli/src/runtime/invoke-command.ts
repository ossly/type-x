import type { CommandContext, CommandHandler } from "@type-x/types";

export const invokeCommand = async (
  handler: CommandHandler,
  context: CommandContext,
): Promise<void> => {
  await handler(context);
};
