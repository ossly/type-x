import type { CommandRequest } from "./request.js";

export interface CommandContext {
  commandName: string;
  request: CommandRequest;
}

export type CommandHandler = (
  context: CommandContext,
) => Promise<void> | void;

export const createCommandContext = (
  commandName: string,
  request: CommandRequest,
): CommandContext => ({
  commandName,
  request,
});
