import type { CommandTask, CommandUi } from "@type-x/types";
import { confirm, input as promptInput } from "@inquirer/prompts";
import ora from "ora";

export const createCommandUi = ({
  input = process.stdin,
  output = process.stdout,
}: {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
} = {}): CommandUi => {
  return {
    confirm: async (message: string): Promise<boolean> => {
      assertInteractive(input, output);

      return confirm(
        {
          message,
        },
        {
          input,
          output,
        },
      );
    },
    input: async (message: string): Promise<string> => {
      assertInteractive(input, output);

      return inputPrompt(message, input, output);
    },
    task: (message: string): CommandTask => {
      if (!isSpinnerCapable(input, output)) {
        return createPlainTask(output, message);
      }

      const spinner = ora({
        text: message,
        stream: output,
        discardStdin: false,
        isEnabled: true,
      }).start();

      return {
        update: (nextMessage: string) => {
          spinner.text = nextMessage;
        },
        done: (nextMessage?: string) => {
          spinner.succeed(nextMessage ?? spinner.text);
        },
        fail: (nextMessage?: string) => {
          spinner.fail(nextMessage ?? spinner.text);
        },
      };
    },
  };
};

const isInteractive = (
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): boolean => {
  return Boolean(
    "isTTY" in input &&
    "isTTY" in output &&
    typeof input.isTTY === "boolean" &&
    typeof output.isTTY === "boolean" &&
    input.isTTY &&
    output.isTTY,
  );
};

const assertInteractive = (
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): void => {
  if (!isInteractive(input, output)) {
    throw new Error("Interactive UI is not available in non-interactive mode.");
  }
};

const isSpinnerCapable = (
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): boolean => {
  return Boolean(
    isInteractive(input, output) &&
    "cursorTo" in output &&
    typeof output.cursorTo === "function" &&
    "clearLine" in output &&
    typeof output.clearLine === "function",
  );
};

const createPlainTask = (
  output: NodeJS.WritableStream,
  message: string,
): CommandTask => {
  writeLine(output, `[ ] ${message}`);

  return {
    update: (nextMessage: string) => {
      writeLine(output, `[ ] ${nextMessage}`);
    },
    done: (nextMessage?: string) => {
      writeLine(output, `[ok] ${nextMessage ?? message}`);
    },
    fail: (nextMessage?: string) => {
      writeLine(output, `[x] ${nextMessage ?? message}`);
    },
  };
};

const inputPrompt = (
  message: string,
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): Promise<string> => {
  return promptInput(
    {
      message,
    },
    {
      input,
      output,
    },
  );
};

const writeLine = (output: NodeJS.WritableStream, message: string): void => {
  output.write(`${message}\n`);
};
