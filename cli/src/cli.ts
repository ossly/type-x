#!/usr/bin/env node

import { createRequest } from "@type-x/runtime";
import { internalCommands } from "./internal/index.js";
import { executeCommand } from "./runtime/execute-command.js";
import { executeResolvedCommand } from "./runtime/execute-resolved-command.js";
import { readCliPackageVersion } from "./runtime/cli-package.js";
import { readRegistry } from "./runtime/registry.js";
import { INTERNAL_COMMAND_NAMES } from "./runtime/internal-command-names.js";
import { resolveCommand } from "./runtime/resolve-command.js";
import { getUpdateNotice } from "./runtime/update-check.js";

const main = async (argv: string[]): Promise<void> => {
  const cliPackageVersion = await readCliPackageVersion();
  // Start update check in parallel with the command so the network request
  // (when cache is stale) overlaps with the command's own work.
  const updateCheckPromise = getUpdateNotice(cliPackageVersion);

  const command = argv[0] ?? INTERNAL_COMMAND_NAMES.HELP;
  const internalCommand = internalCommands[command];

  if (internalCommand) {
    const request = createRequest(command === argv[0] ? argv.slice(1) : [], {
      invocationArgv: argv,
    });

    await executeCommand({
      command: {
        name: command,
        packageName: "@type-x/cli",
        version: cliPackageVersion,
      },
      handler: internalCommand,
      request,
    });
  } else {
    const resolvedCommand = await resolveCommand(command);

    if (resolvedCommand) {
      const request = createRequest(argv.slice(1), {
        invocationArgv: argv,
      });

      await executeResolvedCommand(resolvedCommand, request);
    } else {
      const registry = await readRegistry();
      const alias = registry.aliases[command];

      if (alias) {
        const aliasCommand = internalCommands[INTERNAL_COMMAND_NAMES.RUN_ALIAS];

        if (!aliasCommand) {
          throw new Error("Internal alias runner is not available.");
        }

        const aliasRequest = createRequest([command, ...argv.slice(1)], {
          invocationArgv: [
            INTERNAL_COMMAND_NAMES.RUN_ALIAS,
            command,
            ...argv.slice(1),
          ],
        });

        await executeCommand({
          command: {
            name: INTERNAL_COMMAND_NAMES.RUN_ALIAS,
            packageName: "@type-x/cli",
            version: cliPackageVersion,
          },
          handler: aliasCommand,
          request: aliasRequest,
        });
      } else {
        throw new Error(`Command not found: ${command}`);
      }
    }
  }

  if (process.stderr.isTTY) {
    const latestVersion = await updateCheckPromise;
    if (latestVersion) {
      process.stderr.write(
        `\nUpdate available: ${cliPackageVersion} → ${latestVersion}\n` +
          `Run: npm install -g @type-x/cli\n`,
      );
    }
  }
};

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
