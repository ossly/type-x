#!/usr/bin/env node

import { internalCommands } from "./internal/index.js";
import { executeCommand } from "./runtime/execute-command.js";
import { executeResolvedCommand } from "./runtime/execute-resolved-command.js";
import { createRequest } from "./runtime/request.js";
import { readRegistry } from "./runtime/registry.js";
import { INTERNAL_COMMAND_NAMES } from "./runtime/internal-command-names.js";
import { resolveCommand } from "./runtime/resolve-command.js";

const main = async (argv: string[]): Promise<void> => {
  const request = createRequest(argv);
  const command = argv[0] ?? INTERNAL_COMMAND_NAMES.HELP;
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

  const registry = await readRegistry();
  const alias = registry.aliases[command];

  if (alias) {
    const aliasCommand = internalCommands[INTERNAL_COMMAND_NAMES.RUN_ALIAS];

    if (!aliasCommand) {
      throw new Error("Internal alias runner is not available.");
    }

    const aliasRequest = createRequest([
      INTERNAL_COMMAND_NAMES.RUN_ALIAS,
      command,
      ...argv.slice(1),
    ]);

    return executeCommand({
      command: {
        name: INTERNAL_COMMAND_NAMES.RUN_ALIAS,
        packageName: "@type-x/cli",
        version: "0.0.0",
      },
      handler: aliasCommand,
      request: aliasRequest,
    });
  }

  throw new Error(`Command not found: ${command}`);
};

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
