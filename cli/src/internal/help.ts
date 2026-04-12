import type { CommandHandler } from "@type-x/types";

export const help: CommandHandler = async () => {
  console.log("x - installable command runtime");
  console.log("");
  console.log("Usage");
  console.log("  x <command> [...args]");
  console.log("  x run <package-path> <command-name> [...args]");
  console.log("");
  console.log("Internal commands");
  console.log(
    "  init [path] [--standalone]      Scaffold a new TypeScript command package",
  );
  console.log("  add <package-name-or-path>      Install a package");
  console.log("  upgrade <package-name-or-path>  Upgrade an installed package");
  console.log("  remove <package-name>           Remove an installed package");
  console.log("  ls                              List installed commands");
  console.log("  alias <alias>=<command>         Create a global alias");
  console.log("  aliases                         List configured aliases");
  console.log("  unalias <alias>                 Remove an alias");
  console.log("  run <package-path> <command>    Run a local package command");
  console.log("  doctor                          Show runtime status");
  console.log(
    "  setup-shell                     Add the x bin directory to PATH in your shell config",
  );
  console.log("  --help, -h                      Show this help");
  console.log("  --version, -v                   Show the CLI version");
};
