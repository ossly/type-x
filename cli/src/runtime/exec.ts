import type {
  CommandExec,
  CommandExecOptions,
  CommandExecResult,
} from "@type-x/types";
import { spawn } from "node:child_process";

export const createCommandExec = ({
  cwd,
  env,
}: {
  cwd: string;
  env: Record<string, string | undefined>;
}): CommandExec => {
  return async (
    command: string,
    args: string[] = [],
    options: CommandExecOptions = {},
  ): Promise<CommandExecResult> => {
    const finalCwd = options.cwd ?? cwd;
    const finalEnv = {
      ...env,
      ...options.env,
    };

    return new Promise<CommandExecResult>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: finalCwd,
        env: finalEnv,
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
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

        if ((options.rejectOnNonZero ?? true) && result.exitCode !== 0) {
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
