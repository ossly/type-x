# hello-tools-ts

Example package showing how to author an `x` command in TypeScript with
`@type-x/types`.

## Run locally

From the repo root:

```sh
x run ./examples/hello-tools-ts hello-ts --name Olivia
```

If `--name` is not provided, the command prompts for it interactively.

## Typed store example

```ts
import type { CommandContext } from "@type-x/types";

type HelloStore = {
  runs: number;
  name?: string;
};

export default async function main(context: CommandContext<HelloStore>) {
  const runs = (await context.store.get("runs")) ?? 0;
  await context.store.set("runs", runs + 1);
  await context.store.set("name", "Olivia");
}
```

## UI example

This example also uses the runtime UI task helper to show progress:

```ts
const task = context.ui.task("Loading typed command state");
await wait(1000);
task.update("Persisting typed command state");
await wait(1000);
task.done("Typed command state is ready");
```

The runtime can render a spinner in interactive terminals and fall back to
plain status lines in simpler environments.
