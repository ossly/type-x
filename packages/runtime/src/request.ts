import { parseArgs } from "node:util";

import type { CommandRequest } from "@type-x/types";

export type { CommandRequest } from "@type-x/types";

export type RepeatedFlagsMode = "array" | "last";

export const createRequest = (
  argv: string[],
  {
    invocationArgv = argv,
    cwd = process.cwd(),
    env = process.env,
    repeatedFlags = "array",
  }: {
    invocationArgv?: string[];
    cwd?: string;
    env?: Record<string, string | undefined>;
    repeatedFlags?: RepeatedFlagsMode;
  } = {},
): CommandRequest => {
  const parsedArgs = parseArgs({
    args: argv,
    options: inferOptions(argv, repeatedFlags),
    allowPositionals: true,
    strict: false,
  });

  return {
    raw: argv.join(" "),
    argv,
    args: parsedArgs.positionals,
    flags: normalizeFlags(parsedArgs.values),
    invocation: {
      raw: invocationArgv.join(" "),
      argv: invocationArgv,
    },
    pwd: cwd,
    env,
  };
};

const inferOptions = (
  argv: string[],
  repeatedFlags: RepeatedFlagsMode,
): Record<
  string,
  {
    type: "boolean" | "string";
    short?: string;
    multiple?: true;
  }
> => {
  const options: Record<
    string,
    {
      type: "boolean" | "string";
      short?: string;
      multiple?: true;
    }
  > = {};
  const multiple = repeatedFlags === "array" ? { multiple: true as const } : {};

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
        ...multiple,
      };

      continue;
    }

    const shortFlags = value.slice(1);

    if (shortFlags.length === 1) {
      const short = shortFlags;

      options[short] = {
        type: shouldTreatNextValueAsString(argv[index + 1])
          ? "string"
          : "boolean",
        short,
        ...multiple,
      };
      continue;
    }

    for (const short of shortFlags) {
      options[short] = {
        type: "boolean",
        short,
        ...multiple,
      };
    }
  }

  return options;
};

const normalizeFlags = (
  values: Record<string, string | boolean | string[] | boolean[] | undefined>,
): Record<string, string | boolean | string[] | boolean[]> => {
  const flags: Record<string, string | boolean | string[] | boolean[]> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }

      flags[key] = value.length === 1 ? value[0]! : value;
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
