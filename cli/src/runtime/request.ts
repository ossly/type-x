import type { CommandRequest } from "@type-x/types";

export type { CommandRequest } from "@type-x/types";

export const createRequest = (argv: string[]): CommandRequest => {
  return {
    raw: argv.join(" "),
    argv,
    args: argv.filter((value) => !isFlag(value)),
    flags: parseFlags(argv),
    pwd: process.cwd(),
    env: process.env,
  };
};

const parseFlags = (argv: string[]): Record<string, string | boolean> => {
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value || !isFlag(value)) {
      continue;
    }

    if (value.startsWith("--")) {
      const [name, inlineValue] = value.slice(2).split("=", 2);

      if (!name) {
        continue;
      }

      if (inlineValue !== undefined) {
        flags[name] = inlineValue;
        continue;
      }

      const nextValue = argv[index + 1];

      if (nextValue && !isFlag(nextValue)) {
        flags[name] = nextValue;
        index += 1;
        continue;
      }

      flags[name] = true;
      continue;
    }

    const shortFlags = value.slice(1);

    for (const shortFlag of shortFlags) {
      flags[shortFlag] = true;
    }
  }

  return flags;
};

const isFlag = (value: string): boolean => value.startsWith("-");
