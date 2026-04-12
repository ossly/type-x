import type { CommandEnv } from "@type-x/types";

export const createCommandEnv = (
  env: Record<string, string | undefined>,
): CommandEnv => {
  return {
    get: (name: string): string | undefined => {
      return normalizeEnvValue(env[name]);
    },
    require: (name: string): string => {
      const value = normalizeEnvValue(env[name]);

      if (value === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
      }

      return value;
    },
    has: (name: string): boolean => {
      return normalizeEnvValue(env[name]) !== undefined;
    },
  };
};

const normalizeEnvValue = (value: string | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.length > 0 ? value : undefined;
};
