import type { CommandHandler } from "../runtime/context.js";
import { ensureShellPathSetup, getShellSetupSuggestion } from "../shell/setup-shell.js";

export const setupShell: CommandHandler = async () => {
  const suggestion = getShellSetupSuggestion();

  if (suggestion.pathConfigured) {
    console.log(`${suggestion.binDir} is already in PATH.`);
    return;
  }

  const result = await ensureShellPathSetup();

  if (!result.rcFile) {
    throw new Error(
      `Shell "${result.shellName}" is not supported for automatic setup.`,
    );
  }

  console.log(`Added ${result.binDir} to PATH in ${result.rcFile}.`);
  console.log("Open a new shell or source the file to apply the change.");
};
