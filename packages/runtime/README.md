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

`request.flags` contains parsed CLI flags. A flag used once is exposed as a
single `string` or `boolean`; a repeated flag is exposed as an array:

```sh
my-cli --param a --param b --verbose
```

```ts
context.request.flags.param; // ["a", "b"]
context.request.flags.verbose; // true
```

## Exec

`context.exec()` runs a shell command string and returns:

- `exitCode`
- `stdout`
- `stderr`

Options include:

- `mode`
  `"capture"` is the default and buffers stdout/stderr while optionally streaming them.
  `"inherit"` attaches the child process directly to the current terminal so interactive commands like `sudo`, editors, or prompts behave normally. In this mode, `stdout` and `stderr` are returned as empty strings.
- `silent`
  When `false`, stream command output to the current process stdout/stderr. This is the default.
- `throwOnError`
  When `false`, return non-zero exit codes instead of throwing. By default it is true.

When `throwOnError` is left on and the command exits non-zero, `exec()` throws a `CommandExecError` from `@type-x/runtime`. The error message is a stable summary, and the raw process output is available on the error instance through `stdout`, `stderr`, `exitCode`, `command`, `cwd`, and `mode`. `@type-x/runtime` also exports `isCommandExecError(error)` for structural narrowing when you do not want to rely on `instanceof`.

Example for an interactive command:

```ts
await context.exec("sudo npm install -g some-tool", {
  mode: "inherit",
});
```

Example for handling command failures:

```ts
import { CommandExecError, initCli, isCommandExecError } from "@type-x/runtime";

try {
  await context.exec("git push");
} catch (error) {
  if (error instanceof CommandExecError) {
    console.error(error.exitCode);
    console.error(error.stderr);
  }

  if (isCommandExecError(error)) {
    console.error(error.command);
    console.error(error.stderr);
  }

  throw error;
}
```

## Default Store Location

If you do not override `runtime.homeDir`, the runtime uses:

- `~/.type-x/<sanitized-package-name>`

You can override that explicitly:

```ts
initCli(main, {
  runtime: {
    homeDir: "/some/custom/path",
  },
});
```

## Author

[Iñigo Taibo](https://github.com/itaibo)
