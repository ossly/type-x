# @type-x/types

Shared types for `@type-x/runtime` and `@type-x/cli`.

This package is intentionally small. It contains the public runtime contract:

- `CommandContext`
- `CommandRequest`
- `CommandStore`
- `CommandHandler`
- related `ui`, `exec`, `git`, `io`, and `env` types

Use it when you only want types. If you are already depending on `@type-x/runtime`, you can import the same public types from there as well.

`CommandRequest["flags"]` accepts scalar and repeated flag values:

```ts
Record<string, string | boolean | string[] | boolean[]>;
```

`CommandExec` accepts either a shell command string or an argv tuple:

```ts
context.exec("git status --short");
context.exec(["git", "status", "--short"]);
```

`CommandStore` supports top-level keys and dot paths:

```ts
context.store.set("providers.github", "hello");
context.store.get("providers.github");
```

## Author

[Iñigo Taibo](https://github.com/itaibo)
