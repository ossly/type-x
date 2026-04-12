import { parseArgs } from "node:util";

import type { CommandRequest } from "@type-x/types";

export type { CommandRequest } from "@type-x/types";

export const createRequest = (argv: string[]): CommandRequest => {
  const parsedArgs = parseArgs({
    args: argv,
    options: inferOptions(argv),
    allowPositionals: true,
    strict: false,
  });

  return {
    raw: argv.join(" "),
    argv,
    args: parsedArgs.positionals,
    flags: normalizeFlags(parsedArgs.values),
    pwd: process.cwd(),
    env: process.env,
  };
};

const inferOptions = (
  argv: string[],
): Record<
  string,
  {
    type: "boolean" | "string";
    short?: string;
  }
> => {
  const options: Record<
    string,
    {
      type: "boolean" | "string";
      short?: string;
    }
  > = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value || value === "--" || !isFlag(value)) {
      continue;
    }

    if (value.startsWith("--")) {
      const [name, inlineValue] = value.slice(2).split("=", 2);

      if (!name) {
        continue;
      }

      options[name] = {
        type:
          inlineValue !== undefined ||
          shouldTreatNextValueAsString(argv[index + 1])
            ? "string"
            : "boolean",
      };

      continue;
    }

    const shortFlags = value.slice(1);

    if (shortFlags.length === 1) {
      const short = shortFlags;

      options[short] = {
        type: shouldTreatNextValueAsString(argv[index + 1]) ? "string" : "boolean",
        short,
      };
      continue;
    }

    for (const short of shortFlags) {
      options[short] = {
        type: "boolean",
        short,
      };
    }
  }

  return options;
};

const normalizeFlags = (
  values: Record<string, string | boolean | undefined>,
): Record<string, string | boolean> => {
  const flags: Record<string, string | boolean> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    flags[key] = value;
  }

  return flags;
};

const shouldTreatNextValueAsString = (
  nextValue: string | undefined,
): boolean => {
  if (!nextValue || nextValue === "--") {
    return false;
  }

  if (!isFlag(nextValue)) {
    return true;
  }

  return isNumericValue(nextValue);
};

const isNumericValue = (value: string): boolean => {
  return /^-?\d+(\.\d+)?$/.test(value);
};

const isFlag = (value: string): boolean => value.startsWith("-");
