export default async function main(context) {
  const previousRuns = (await context.store.get("runs")) ?? 0;
  const runs = Number(previousRuns) + 1;

  await context.store.set("runs", runs);

  context.log.info("hello from local package");
  context.log.info(`command: ${context.command.name}`);
  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);
  context.log.info(`argv: ${JSON.stringify(context.request.argv)}`);
  context.log.info(`runs: ${runs}`);
}
