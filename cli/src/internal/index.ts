import type { CommandHandler } from "../runtime/context.js";
import { add } from "./add.js";
import { doctor } from "./doctor.js";
import { listCommands } from "./ls.js";
import { remove } from "./remove.js";
import { run } from "./run.js";
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

  alias: () => console.log("alias"),
  unalias: () => console.log("unalias"),

  doctor: doctor,
  run: run,
};
