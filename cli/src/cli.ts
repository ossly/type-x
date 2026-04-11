#!/usr/bin/env node

import { internalCommands } from "./internal/index.js";
import { executeCommand } from "./runtime/execute-command.js";
import { executeResolvedCommand } from "./runtime/execute-resolved-command.js";
import { createRequest } from "./runtime/request.js";
import { resolveCommand } from "./runtime/resolve-command.js";

const main = async (argv: string[]): Promise<void> => {
  const request = createRequest(argv);
  const command = argv[0] ?? "--help";
  const internalCommand = internalCommands[command];

  if (internalCommand) {
    return executeCommand({
      command: {
        name: command,
        packageName: "@type-x/cli",
        version: "0.0.0",
      },
      handler: internalCommand,
      request,
    });
  }

  const resolvedCommand = await resolveCommand(command);

  if (resolvedCommand) {
    return executeResolvedCommand(resolvedCommand, request);
  }

  throw new Error(`Command not found: ${command}`);
};

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
