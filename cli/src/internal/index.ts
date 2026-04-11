import type { CommandHandler } from "../runtime/context.js";
import { add } from "./add.js";
import { doctor } from "./doctor.js";
import { listCommands } from "./ls.js";
import { run } from "./run.js";

export const internalCommands: Record<string, CommandHandler> = {
  "--help": () => console.log("help"),
  "-h": () => console.log("help"),

  "--version": () => console.log("version"),
  "-v": () => console.log("version"),

  ls: listCommands,

  add: add,

  remove: () => console.log("remove"),
  rm: () => console.log("remove"),

  upgrade: () => console.log("upgrade"),

  alias: () => console.log("alias"),
  unalias: () => console.log("unalias"),

  doctor: doctor,
  run: run,
};
