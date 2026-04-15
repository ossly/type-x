import type {
  CommandExec,
  CommandExecOptions,
  CommandExecResult,
} from "@type-x/types";
import { spawn } from "node:child_process";
import process from "node:process";
import { CommandExecError } from "./errors.js";

export const createCommandExec = ({
  cwd,
  env,
}: {
  cwd: string;
  env: Record<string, string | undefined>;
}): CommandExec => {
  return async (
    command: string,
    options: CommandExecOptions = {},
  ): Promise<CommandExecResult> => {
    const finalCwd = options.cwd ?? cwd;
    const finalEnv = {
      ...env,
      ...options.env,
    };
    const mode = options.mode ?? "capture";
    const silent = options.silent ?? false;

    if (mode === "inherit") {
      if (options.input !== undefined) {
        throw new Error('`exec` cannot use `input` when `mode` is "inherit".');
      }

      if (silent) {
        throw new Error(
          '`exec` cannot use `silent: true` when `mode` is "inherit".',
        );
      }
    }

    return new Promise<CommandExecResult>((resolve, reject) => {
      const child = spawn(command, {
        cwd: finalCwd,
        env: finalEnv,
        shell: true,
        stdio: mode === "inherit" ? "inherit" : "pipe",
      });

      let stdout = "";
      let stderr = "";

      if (mode === "capture") {
        const childStdout = child.stdout;
        const childStderr = child.stderr;
        const childStdin = child.stdin;

        if (!childStdout || !childStderr || !childStdin) {
          reject(
            new Error('`exec` could not create piped stdio in "capture" mode.'),
          );
          return;
        }

        childStdout.on("data", (chunk: Buffer | string) => {
          const text = chunk.toString();
          stdout += text;

          if (!silent) {
            process.stdout.write(text);
          }
        });

        childStderr.on("data", (chunk: Buffer | string) => {
          const text = chunk.toString();
          stderr += text;

          if (!silent) {
            process.stderr.write(text);
          }
        });
      }

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        const result: CommandExecResult = {
          exitCode: code ?? 1,
          stdout,
          stderr,
        };

        if ((options.throwOnError ?? true) && result.exitCode !== 0) {
          reject(
            new CommandExecError({
              command,
              exitCode: result.exitCode,
              stdout,
              stderr,
              cwd: finalCwd,
              mode,
            }),
          );
          return;
        }

        resolve(result);
      });

      if (mode === "capture") {
        const childStdin = child.stdin;

        if (!childStdin) {
          reject(
            new Error('`exec` could not create piped stdin in "capture" mode.'),
          );
          return;
        }

        if (options.input !== undefined) {
          childStdin.write(options.input);
        }

        childStdin.end();
      }
    });
  };
};
