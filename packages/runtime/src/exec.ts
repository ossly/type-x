import type {
  CommandExec,
  CommandExecOptions,
  CommandExecResult,
} from "@type-x/types";
import { spawn } from "node:child_process";
import process from "node:process";

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
    const silent = options.silent ?? false;

    return new Promise<CommandExecResult>((resolve, reject) => {
      const child = spawn(command, {
        cwd: finalCwd,
        env: finalEnv,
        shell: true,
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        const text = chunk.toString();
        stdout += text;

        if (!silent) {
          process.stdout.write(text);
        }
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        const text = chunk.toString();
        stderr += text;

        if (!silent) {
          process.stderr.write(text);
        }
      });

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
            new Error(
              `Command "${command}" exited with code ${result.exitCode}: ${stderr || stdout}`.trim(),
            ),
          );
          return;
        }

        resolve(result);
      });

      if (options.input !== undefined) {
        child.stdin.write(options.input);
      }

      child.stdin.end();
    });
  };
};
