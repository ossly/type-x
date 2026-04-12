import { createRequest } from "@type-x/runtime";
import type { CommandHandler } from "@type-x/types";
import { executeResolvedCommand } from "../runtime/execute-resolved-command.js";
import { readRegistry } from "../runtime/registry.js";
import { resolveCommand } from "../runtime/resolve-command.js";

export const runAlias: CommandHandler = async ({ request }) => {
  const [aliasName, ...forwardedArgv] = request.argv;

  if (!aliasName) {
    throw new Error("Usage: x run-alias <alias-name> [...args]");
  }

  const registry = await readRegistry();
  const alias = registry.aliases[aliasName];

  if (!alias) {
    throw new Error(`Alias "${aliasName}" does not exist.`);
  }

  const resolvedCommand = await resolveCommand(alias.targetCommand);

  if (!resolvedCommand) {
    throw new Error(
      `Alias "${aliasName}" points to missing command "${alias.targetCommand}".`,
    );
  }

  const aliasRequest = createRequest(forwardedArgv, {
    invocationArgv: [aliasName, ...forwardedArgv],
  });

  await executeResolvedCommand(resolvedCommand, aliasRequest, aliasName);
};
