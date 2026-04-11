import { doctor } from "./doctor.js";
import { listCommands } from "./ls.js";

export const internalCommands = {
  "--help": () => console.log("help"),
  "-h": () => console.log("help"),

  "--version": () => console.log("version"),
  "-v": () => console.log("version"),

  ls: listCommands,

  add: () => console.log("add"),

  remove: () => console.log("remove"),
  rm: () => console.log("remove"),

  upgrade: () => console.log("upgrade"),

  alias: () => console.log("alias"),
  unalias: () => console.log("unalias"),

  doctor: doctor,
};
