import type { CommandRequest } from "./request.js";

export interface CommandMetadata {
  name: string;
  packageName: string;
  version: string;
  aliasUsed?: string;
}

export interface CommandContext {
  command: CommandMetadata;
  request: CommandRequest;
  log: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
}

export type CommandHandler = (
  context: CommandContext,
) => Promise<void> | void;

export const createCommandContext = (
  command: CommandMetadata,
  request: CommandRequest,
): CommandContext => ({
  command,
  request,
  log: {
    info: (...args: unknown[]) => console.log(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => console.error(...args),
  },
});
