import type { CommandContext } from "@type-x/types";

type HelloStore = {
  runs: number;
  lastName?: string;
};

export default async function main(
  context: CommandContext<HelloStore>,
): Promise<void> {
  const previousRuns = (await context.store.get("runs")) ?? 0;
  const runs = previousRuns + 1;
  const name = getName(context.request.flags.name);

  await context.store.set("runs", runs);

  if (name) {
    await context.store.set("lastName", name);
  }

  const storedState = await context.store.all();

  context.log.info("hello from typed package");
  context.log.info(`command: ${context.command.name}`);
  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);
  context.log.info(`runs: ${runs}`);
  context.log.info(`lastName: ${storedState.lastName ?? "none"}`);
}

const getName = (
  value: string | boolean | undefined,
): string | undefined => {
  return typeof value === "string" ? value : undefined;
};
