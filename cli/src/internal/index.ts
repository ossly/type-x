import type { CommandHandler } from "@type-x/types";
import { add } from "./add.js";
import { alias } from "./alias.js";
import { listAliases } from "./aliases.js";
import { doctor } from "./doctor.js";
import { help } from "./help.js";
import { init } from "./init.js";
import { listCommands } from "./ls.js";
import { remove } from "./remove.js";
import { run } from "./run.js";
import { runAlias } from "./run-alias.js";
import { setupShell } from "./setup-shell.js";
import { unalias } from "./unalias.js";
import { upgrade } from "./upgrade.js";
import { INTERNAL_COMMAND_NAMES } from "../runtime/internal-command-names.js";

export const internalCommands: Record<string, CommandHandler> = {
  [INTERNAL_COMMAND_NAMES.HELP]: help,
  [INTERNAL_COMMAND_NAMES.HELP_SHORT]: help,

  [INTERNAL_COMMAND_NAMES.VERSION]: () => console.log("0.0.0"),
  [INTERNAL_COMMAND_NAMES.VERSION_SHORT]: () => console.log("0.0.0"),

  [INTERNAL_COMMAND_NAMES.LIST_COMMANDS]: listCommands,

  [INTERNAL_COMMAND_NAMES.ADD]: add,
  [INTERNAL_COMMAND_NAMES.INIT]: init,

  [INTERNAL_COMMAND_NAMES.REMOVE]: remove,
  [INTERNAL_COMMAND_NAMES.REMOVE_SHORT]: remove,

  [INTERNAL_COMMAND_NAMES.UPGRADE]: upgrade,

  [INTERNAL_COMMAND_NAMES.ALIAS]: alias,
  [INTERNAL_COMMAND_NAMES.LIST_ALIASES]: listAliases,
  [INTERNAL_COMMAND_NAMES.UNALIAS]: unalias,

  [INTERNAL_COMMAND_NAMES.DOCTOR]: doctor,
  [INTERNAL_COMMAND_NAMES.RUN]: run,
  [INTERNAL_COMMAND_NAMES.RUN_ALIAS]: runAlias,
  [INTERNAL_COMMAND_NAMES.SETUP_SHELL]: setupShell,
};
