# @type-x/cli

`@type-x/cli` is the package behind the `x` binary.

## What It Does

- installs command packages with `x add`
- runs installed commands with `x <command>`
- runs local packages with `x run <package-path> <command>`
- manages aliases with `x alias`, `x aliases`, and `x unalias`
- scaffolds new packages with `x init`

## Private Packages And Custom Registries

`x add` and `x upgrade` can pass npm-style registry/auth options through to the
underlying `npm pack` call:

```sh
x add @acme/private-tool --registry https://npm.pkg.github.com --scope @acme --token-env GITHUB_TOKEN
x upgrade @acme/private-tool
```

- `--registry <url>`
  Uses a specific npm registry for the package fetch.
- `--scope <scope>`
  Writes scope-specific registry config like `@acme:registry=...` for the pack.
- `--token-env <ENV_NAME>`
  Reads the auth token from an environment variable.
- `--token <value>`
  Passes a one-shot token for the current install or upgrade only.

The local `x` registry stores the package source metadata needed for later
`x upgrade` runs, including the package specifier, registry URL, scope, and
optional token env var name. Token values are never stored.

Precedence is:

1. current command flags
2. stored package source metadata

## Init

The scaffold is TypeScript-only.

```sh
x init my-command
x init my-command --package-name @acme/my-command --command-name hello
x init my-cli --standalone --package-name @acme/my-cli --command-name my-cli
```

- default `x init`
  Creates a package meant to be consumed by `x`
- `x init --standalone`
  Creates a normal npm CLI powered by `@type-x/runtime`

## Runtime Injection

When `x` executes a command, it injects the runtime context from `@type-x/runtime`:

- `command`
- `request`
- `store`
- `log`
- `ui`
- `exec`
- `git`
- `io`
- `env`

## Store Behavior

Installed commands use the `x` runtime home, which defaults to `~/.type-x/type-x__cli`.

Stores are shared per package, not per command. If a package exposes multiple commands, they all read and write the same package store file under `~/.type-x/type-x__cli/stores`.

## Internal Commands

The built-in commands are intentionally small:

- `init`
- `add`
- `upgrade`
- `remove`
- `ls`
- `alias`
- `aliases`
- `unalias`
- `run`
- `doctor`
- `setup-shell`
