import type { CommandContext, CommandHandler } from "@type-x/types";

export const invokeCommand = async <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  handler: CommandHandler<TStore>,
  context: CommandContext<TStore>,
): Promise<void> => {
  await handler(context);
};
