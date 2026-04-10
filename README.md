# type-x

- `cli`: main `type-x` CLI package, `@type-x/cli`
- `packages/typescript-config`: shared TypeScript config
- `packages/eslint-config`: shared ESLint config

## Local development

To test the CLI locally, the simplest workflow is to run TypeScript in watch mode and use a shell alias with a different name.

1. Start the build in watch mode:

```sh
pnpm --filter @type-x/cli build --watch
```

2. Create a local alias pointing to the compiled file:

```sh
alias x-dev='node /...path/type-x/cli/dist/src/cli.js'
```

3. Run the CLI with that alias:

```sh
x-dev
x-dev hello
x-dev add foo
```

If you want the alias to persist across shell sessions, add it to your `~/.zshrc`.

This keeps the published binary name as `x`, while letting you iterate locally with `x-dev` without conflicts.
