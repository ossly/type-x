# type-x

Monorepo for the `x` command runtime, the standalone runtime package, and the shared types.

## Packages

- `cli`
  Published as `@type-x/cli`. This is the `x` binary.
- `packages/runtime`
  Published as `@type-x/runtime`. Use this to build a standalone CLI with the same runtime context.
- `packages/types`
  Published as `@type-x/types`. Shared runtime-facing types.

## Local Development

Install workspace dependencies:

```sh
pnpm install
```

Build everything once:

```sh
pnpm build
```

The usual CLI loop is:

```sh
pnpm --filter @type-x/cli build --watch
alias x-dev='node /absolute/path/to/type-x/cli/dist/src/cli.js'
```

Then use it like:

```sh
x-dev --help
x-dev init demo
x-dev init demo-standalone --standalone
```

Useful package-level commands:

```sh
pnpm --filter @type-x/runtime test
pnpm --filter @type-x/cli test
pnpm --filter @type-x/cli lint
pnpm --filter @type-x/runtime lint
```

## How It Fits Together

- `@type-x/cli` installs and runs `x` packages declared through the `x` field in `package.json`
- `@type-x/runtime` is for normal npm CLIs that want the same injected context without requiring global `x`
- `@type-x/types` keeps the runtime contract small and shareable

## Private Registries

The `x` CLI supports npm-style package sources, including custom registries and
private packages. Example:

```sh
x add @acme/private-tool --registry https://npm.pkg.github.com --token-env GITHUB_TOKEN
x upgrade @acme/private-tool
```

`x upgrade` reuses the package source settings from the original install, so you
do not need to pass the registry again. Token values are never stored.

You can also pass a token directly for a one-shot install or upgrade:

```sh
x add @acme/private-tool --registry https://npm.pkg.github.com --token "$GITHUB_TOKEN"
```

## Author

[Iñigo Taibo](https://github.com/itaibo)
