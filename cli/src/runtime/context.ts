import { createCommandContext as createBaseCommandContext } from "@type-x/runtime";
import type { CommandContext, CommandMetadata, CommandRequest } from "@type-x/types";
import { getRuntimePaths } from "./paths.js";

export const createCommandContext = (
  command: CommandMetadata,
  request: CommandRequest,
): CommandContext => {
  const runtimeHomeDir = getRuntimePaths().homeDir;
  return createBaseCommandContext(command, request, runtimeHomeDir);
};
