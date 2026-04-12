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

  context.log.info(`command: ${context.command.name}`);
  context.log.info(`runs: ${runs + 1}`);
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

## Default Store Location

If you do not override `runtime.homeDir`:

- running from the package checkout uses
  `<package-root>/.type-x/<sanitized-package-name>`
- running outside the package checkout uses
  `~/.type-x/<sanitized-package-name>`

You can override that explicitly:

```ts
initCli(main, {
  runtime: {
    homeDir: "/some/custom/path"
  }
});
```

