# @type-x/runtime

`@type-x/runtime` lets you build a normal npm CLI while still getting the same runtime context used by `x`.

## Main API

Use `initCli` in your entrypoint:

```ts
import { initCli, type CommandContext } from "@type-x/runtime";

type Store = {
  runs: number;
};

async function main(context: CommandContext<Store>): Promise<void> {
  const runs = (await context.store.get("runs")) ?? 0;
  await context.store.set("runs", runs + 1);

  const gitStatus = await context.exec("git status --short", {
    throwOnError: false,
    silent: true,
  });

  context.log.info(`command: ${context.command.name}`);
  context.log.info(`runs: ${runs + 1}`);
  context.log.info(`git status exit code: ${gitStatus.exitCode}`);
}

initCli(main);
```

## Context

The injected context exposes:

- `command`
- `request`
- `store`
- `log`
- `ui`
- `exec`
- `git`
- `io`
- `env`

## Exec

`context.exec()` runs a shell command string and returns:

- `exitCode`
- `stdout`
- `stderr`

Options include:

- `silent`
  When `false`, stream command output to the current process stdout/stderr. This is the default.
- `throwOnError`
  When `false`, return non-zero exit codes instead of throwing.

## Default Store Location

If you do not override `runtime.homeDir`, the runtime uses:

- `~/.type-x/<sanitized-package-name>`

You can override that explicitly:

```ts
initCli(main, {
  runtime: {
    homeDir: "/some/custom/path"
  }
});
```

## Author

[Iñigo Taibo](https://github.com/itaibo)
