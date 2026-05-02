import type {
  CommandExec,
  CommandExecCommand,
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
    command: CommandExecCommand,
    options: CommandExecOptions = {},
  ): Promise<CommandExecResult> => {
    const invocation = resolveCommandInvocation(command);
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
      const child = spawn(invocation.file, invocation.args, {
        cwd: finalCwd,
        env: finalEnv,
        detached: process.platform !== "win32",
        shell: invocation.shell,
        stdio: mode === "inherit" ? "inherit" : "pipe",
      });
      const cleanupSignalForwarding = forwardTerminationSignals(child);

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
        cleanupSignalForwarding();
        reject(error);
      });

      child.on("close", (code, signal) => {
        cleanupSignalForwarding();
        const result: CommandExecResult = {
          exitCode: code ?? getSignalExitCode(signal) ?? 1,
          stdout,
          stderr,
        };

        if ((options.throwOnError ?? true) && result.exitCode !== 0) {
          reject(
            new CommandExecError({
              command: invocation.displayCommand,
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

type KillableChildProcess = {
  kill(signal?: NodeJS.Signals | number): boolean;
  pid?: number | undefined;
};

const forwardTerminationSignals = (
  child: KillableChildProcess,
): (() => void) => {
  let cleanup = (): void => {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  };
  const forwardSignal = (signal: NodeJS.Signals): void => {
    cleanup();
    killChildProcessGroup(child, signal);
    process.kill(process.pid, signal);
  };
  const onSigint = (): void => {
    forwardSignal("SIGINT");
  };
  const onSigterm = (): void => {
    forwardSignal("SIGTERM");
  };

  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);

  return () => {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  };
};

const killChildProcessGroup = (
  child: KillableChildProcess,
  signal: NodeJS.Signals,
): void => {
  if (process.platform !== "win32" && child.pid !== undefined) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to killing the child directly below.
    }
  }

  child.kill(signal);
};

const getSignalExitCode = (
  signal: NodeJS.Signals | null,
): number | undefined => {
  if (signal === "SIGINT") {
    return 130;
  }

  if (signal === "SIGTERM") {
    return 143;
  }

  return undefined;
};

const resolveCommandInvocation = (
  command: CommandExecCommand,
): {
  file: string;
  args: string[];
  shell: boolean;
  displayCommand: string;
} => {
  if (typeof command === "string") {
    return {
      file: command,
      args: [],
      shell: true,
      displayCommand: command,
    };
  }

  const [file, ...args] = command;

  if (!file) {
    throw new Error("`exec` command arrays must include a command name.");
  }

  return {
    file,
    args,
    shell: false,
    displayCommand: shellJoin(command),
  };
};

const shellJoin = (values: readonly string[]): string => {
  return values.map(shellQuote).join(" ");
};

const shellQuote = (value: string): string => {
  if (/^[a-zA-Z0-9_./:=@+-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
};
