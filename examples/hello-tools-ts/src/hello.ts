import type { CommandContext } from "@type-x/types";

type HelloStore = {
  runs: number;
  name?: string;
};

export default async function main(
  context: CommandContext<HelloStore>,
): Promise<void> {
  const previousRuns = (await context.store.get("runs")) ?? 0;
  const runs = previousRuns + 1;
  const name = await resolveName(context);

  const task = context.ui.task("Loading typed command state");
  await wait(1000);
  task.update("Persisting typed command state");

  await context.store.set("runs", runs);
  await context.store.set("name", name);

  const storedState = await context.store.all();

  await wait(1000);
  task.done("Typed command state is ready");

  context.log.info("hello from typed package");
  context.log.info(`command: ${context.command.name}`);
  context.log.info(
    `package: ${context.command.packageName}@${context.command.version}`,
  );
  context.log.info(`name: ${name}`);
  context.log.info(`runs: ${runs}`);
  context.log.info(`storedName: ${storedState.name ?? "none"}`);
  context.log.info(
    "ui: task() can show loading, progress updates, and completion",
  );
}

const getName = (value: string | boolean | undefined): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const resolveName = async (
  context: CommandContext<HelloStore>,
): Promise<string> => {
  const flagName = getName(context.request.flags.name);

  if (flagName) {
    return flagName;
  }

  return context.ui.input("What is your name?");
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
