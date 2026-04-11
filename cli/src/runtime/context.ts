import type {
  CommandContext,
  CommandMetadata,
  CommandRequest,
} from "@type-x/types";
import { createCommandStore } from "./command-store.js";

export const createCommandContext = (
  command: CommandMetadata,
  request: CommandRequest,
): CommandContext => ({
  command,
  request,
  store: createCommandStore(command.packageName, command.name),
  log: {
    info: (...args: unknown[]) => console.log(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => console.error(...args),
  },
});
