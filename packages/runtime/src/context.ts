import type {
  CommandContext,
  CommandMetadata,
  CommandRequest,
} from "@type-x/types";
import { createCommandStore } from "./command-store.js";
import { createCommandEnv } from "./env.js";
import { createCommandExec } from "./exec.js";
import { createCommandGit } from "./git.js";
import { createCommandIo } from "./io.js";
import { createCommandUi } from "./ui.js";

export const createCommandContext = <
  TStore extends Record<string, unknown> = Record<string, unknown>,
>(
  command: CommandMetadata,
  request: CommandRequest,
  runtimeHomeDir: string,
): CommandContext<TStore> => {
  const exec = createCommandExec({
    cwd: request.pwd,
    env: request.env,
  });

  return {
    command,
    request,
    store: createCommandStore<TStore>(command.packageName, runtimeHomeDir),
    log: {
      info: (...args: unknown[]) => console.log(...args),
      warn: (...args: unknown[]) => console.warn(...args),
      error: (...args: unknown[]) => console.error(...args),
    },
    ui: createCommandUi(),
    exec,
    git: createCommandGit(exec),
    io: createCommandIo({
      cwd: request.pwd,
    }),
    env: createCommandEnv(request.env),
  };
};
