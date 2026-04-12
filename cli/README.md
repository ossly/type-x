# @type-x/cli

`@type-x/cli` is the package behind the `x` binary.

## What It Does

- installs command packages with `x add`
- runs installed commands with `x <command>`
- runs local packages with `x run <package-path> <command>`
- manages aliases with `x alias`, `x aliases`, and `x unalias`
- scaffolds new packages with `x init`

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
