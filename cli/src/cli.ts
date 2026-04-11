#!/usr/bin/env node

import { internalCommands } from './internal/index.js';
import { readRegistry } from './runtime/registry.js';

const main = async (argv: string[]) => {
  const command = argv[0] ?? '--help';

  if (command in internalCommands) {
    return internalCommands[command as keyof typeof internalCommands]();
  }

  const registry = await readRegistry();
  const registeredCommand = registry.commands[command];

  if (registeredCommand) {
    console.log(
      `External command: ${command} (${registeredCommand.packageName}@${registeredCommand.packageVersion})`,
    );
    return;
  }

  console.log(`External command not found: ${command}`);
};

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
