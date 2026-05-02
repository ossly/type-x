import type {
  CommandExecErrorDetails,
  CommandFailOptions,
} from "@type-x/types";

export class CommandFailure extends Error {
  exitCode: number;
  code: "COMMAND_FAILURE";

  constructor(message: string, options: CommandFailOptions = {}) {
    super(message);
    this.name = "CommandFailure";
    this.exitCode = options.exitCode ?? 1;
    this.code = "COMMAND_FAILURE";
  }
}

export const isCommandFailure = (error: unknown): error is CommandFailure => {
  return Boolean(
    error instanceof Error &&
    "code" in error &&
    error.code === "COMMAND_FAILURE" &&
    "exitCode" in error &&
    typeof error.exitCode === "number",
  );
};

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
    if (this.stdout && this.stderr) {
      return `${this.stdout}\n${this.stderr}`;
    }
    return this.stderr || this.stdout;
  }
}

export const isCommandExecError = (
  error: unknown,
): error is Error & CommandExecErrorDetails => {
  return Boolean(
    error instanceof Error &&
    "code" in error &&
    error.code === "COMMAND_EXEC_ERROR" &&
    "command" in error &&
    typeof error.command === "string" &&
    "exitCode" in error &&
    typeof error.exitCode === "number" &&
    "stdout" in error &&
    typeof error.stdout === "string" &&
    "stderr" in error &&
    typeof error.stderr === "string" &&
    "cwd" in error &&
    typeof error.cwd === "string" &&
    "mode" in error &&
    (error.mode === "capture" || error.mode === "inherit"),
  );
};
