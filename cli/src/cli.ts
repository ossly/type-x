#!/usr/bin/env node

import { internalCommands } from "./internal/index.js";
import { invokeCommand } from "./runtime/invoke-command.js";
import { createRequest } from "./runtime/request.js";
import { resolveCommand } from "./runtime/resolve-command.js";

const main = async (argv: string[]): Promise<void> => {
  const request = createRequest(argv);
  const command = argv[0] ?? "--help";
  const internalCommand = internalCommands[command];

  if (internalCommand) {
    return invokeCommand(command, internalCommand, request);
  }

  const resolvedCommand = await resolveCommand(command);

  if (resolvedCommand) {
    console.log(
      `Resolved external command: ${resolvedCommand.commandName} (${resolvedCommand.packageName}@${resolvedCommand.packageVersion}) -> ${resolvedCommand.packagePath}/${resolvedCommand.entry}`,
    );
    return;
  }

  throw new Error(`External command not found: ${command}`);
};

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
