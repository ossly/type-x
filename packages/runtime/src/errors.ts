import type { CommandExecErrorDetails } from "@type-x/types";

export class CommandExecError extends Error implements CommandExecErrorDetails {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  cwd: string;
  mode: "capture" | "inherit";
  code: "COMMAND_EXEC_ERROR";

  constructor({
    command,
    exitCode,
    stdout,
    stderr,
    cwd,
    mode,
  }: CommandExecErrorDetails) {
    super(`Command "${command}" exited with code ${exitCode}`);
    this.name = "CommandExecError";
    this.command = command;
    this.exitCode = exitCode;
    this.stdout = stdout;
    this.stderr = stderr;
    this.cwd = cwd;
    this.mode = mode;
    this.code = "COMMAND_EXEC_ERROR";
  }

  get combinedOutput(): string {
    return this.stderr || this.stdout;
  }
}
