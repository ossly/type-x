export const INTERNAL_COMMAND_NAMES = {
  ADD: "add",
  UPGRADE: "upgrade",
  REMOVE: "remove",
  REMOVE_SHORT: "rm",
  LIST_COMMANDS: "ls",
  ALIAS: "alias",
  LIST_ALIASES: "aliases",
  UNALIAS: "unalias",
  RUN: "run",
  DOCTOR: "doctor",
  RUN_ALIAS: "run-alias",
  SETUP_SHELL: "setup-shell",
  HELP: "--help",
  HELP_SHORT: "-h",
  VERSION: "--version",
  VERSION_SHORT: "-v",
} as const;

export const INTERNAL_COMMAND_NAME_SET: ReadonlySet<string> = new Set(
  Object.values(INTERNAL_COMMAND_NAMES),
);
