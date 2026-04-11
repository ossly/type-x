export default async function main(context) {
  context.log.info("hello from local package");
  context.log.info(`command: ${context.command.name}`);
  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);
  context.log.info(`argv: ${JSON.stringify(context.request.argv)}`);
}
