import type { CommandHandler } from "@type-x/types";
import { add } from "./add.js";
import { alias } from "./alias.js";
import { listAliases } from "./aliases.js";
import { doctor } from "./doctor.js";
import { listCommands } from "./ls.js";
import { remove } from "./remove.js";
import { run } from "./run.js";
import { runAlias } from "./run-alias.js";
import { setupShell } from "./setup-shell.js";
import { unalias } from "./unalias.js";
import { upgrade } from "./upgrade.js";

export const internalCommands: Record<string, CommandHandler> = {
  "--help": () => console.log("help"),
  "-h": () => console.log("help"),

  "--version": () => console.log("version"),
  "-v": () => console.log("version"),

  ls: listCommands,

  add: add,

  remove: remove,
  rm: remove,

  upgrade: upgrade,

  alias: alias,
  aliases: listAliases,
  unalias: unalias,

  doctor: doctor,
  run: run,
  "run-alias": runAlias,
  "setup-shell": setupShell,
};
