# hello-tools-ts

Example package showing how to author an `x` command in TypeScript with
`@type-x/types`.

## Run locally

From the repo root:

```sh
x run ./examples/hello-tools-ts hello-ts --name Olivia
```

## Typed store example

```ts
import type { CommandContext } from "@type-x/types";

type HelloStore = {
  runs: number;
  lastName?: string;
};

export default async function main(context: CommandContext<HelloStore>) {
  const runs = (await context.store.get("runs")) ?? 0;
  await context.store.set("runs", runs + 1);
}
```
