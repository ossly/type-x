import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

import { createCommandStore, initCli } from "../dist/src/index.js";

test("initCli uses ~/.type-x/<package-name> store by default", async () => {
  const previousArgv = process.argv;
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const previousHome = process.env.HOME;
  const cwd = await mkdtemp(join(tmpdir(), "type-x-runtime-project-"));
  const fakeHome = await mkdtemp(join(tmpdir(), "type-x-runtime-home-root-"));
  const entryFilePath = join(cwd, "dist/cli.js");
  let resolveHandler;
  const handlerFinished = new Promise((resolve) => {
    resolveHandler = resolve;
  });

  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify(
      {
        name: "@examples/runtime-cli",
        version: "1.2.3",
        bin: {
          "runtime-cli": "./dist/cli.js",
        },
      },
      null,
      2,
    ) + "\n",
  );

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.HOME = fakeHome;
  process.argv = ["node", entryFilePath, "hello", "123"];

  try {
    initCli(
      async (context) => {
        await context.store.set("runs", 1);

        assert.equal(context.command.name, "runtime-cli");
        assert.equal(context.command.packageName, "@examples/runtime-cli");
        assert.equal(context.command.version, "1.2.3");
        assert.deepEqual(context.request.argv, ["hello", "123"]);
        assert.deepEqual(context.request.args, ["hello", "123"]);
        assert.equal(context.request.invocation.raw, "runtime-cli hello 123");
        resolveHandler();
      },
      {
        cwd,
        entryFilePath,
      },
    );

    await handlerFinished;

    const storeFilePath = join(
      fakeHome,
      ".type-x",
      "examples__runtime-cli",
      "stores",
      "@examples__runtime-cli.json",
    );
    const storeContent = await readFile(storeFilePath, "utf8");

    assert.match(storeContent, /"runs": 1/);
  } finally {
    process.argv = previousArgv;
    restoreEnvVar("HOME", previousHome);
  }
});

test("initCli supports overriding runtime homeDir", async () => {
  const previousArgv = process.argv;
  const cwd = await mkdtemp(join(tmpdir(), "type-x-runtime-home-"));
  const entryFilePath = join(cwd, "dist/cli.js");
  const customHomeDir = join(cwd, ".custom-runtime-home");
  let resolveHandler;
  const handlerFinished = new Promise((resolve) => {
    resolveHandler = resolve;
  });

  process.argv = ["node", entryFilePath, "hello"];

  try {
    initCli(
      async (context) => {
        await context.store.set("runs", 2);
        resolveHandler();
      },
      {
        cwd,
        entryFilePath,
        name: "runtime-cli",
        packageName: "@examples/runtime-cli",
        version: "1.2.3",
        runtime: {
          homeDir: customHomeDir,
        },
      },
    );

    await handlerFinished;

    const store = createCommandStore("@examples/runtime-cli", customHomeDir);
    assert.equal(await store.get("runs"), 2);
  } finally {
    process.argv = previousArgv;
  }
});

test("initCli expands ~ in runtime homeDir overrides", async () => {
  const previousArgv = process.argv;
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const previousHome = process.env.HOME;
  const cwd = await mkdtemp(join(tmpdir(), "type-x-runtime-home-tilde-"));
  const fakeHome = await mkdtemp(join(tmpdir(), "type-x-runtime-home-root-"));
  const entryFilePath = join(cwd, "dist/cli.js");
  let resolveHandler;
  const handlerFinished = new Promise((resolve) => {
    resolveHandler = resolve;
  });

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.HOME = fakeHome;
  process.argv = ["node", entryFilePath, "hello"];

  try {
    initCli(
      async (context) => {
        await context.store.set("runs", 3);
        resolveHandler();
      },
      {
        cwd,
        entryFilePath,
        name: "runtime-cli",
        packageName: "@examples/runtime-cli",
        version: "1.2.3",
        runtime: {
          homeDir: "~/.hello",
        },
      },
    );

    await handlerFinished;

    const store = createCommandStore(
      "@examples/runtime-cli",
      join(fakeHome, ".hello"),
    );
    assert.equal(await store.get("runs"), 3);
  } finally {
    process.argv = previousArgv;
    restoreEnvVar("HOME", previousHome);
  }
});

test("initCli supports repeated flag parsing options", async () => {
  const previousArgv = process.argv;
  const cwd = await mkdtemp(join(tmpdir(), "type-x-runtime-flags-"));
  const entryFilePath = join(cwd, "dist/cli.js");
  let resolveHandler;
  const handlerFinished = new Promise((resolve) => {
    resolveHandler = resolve;
  });

  process.argv = ["node", entryFilePath, "--param", "a", "--param", "b"];

  try {
    initCli(
      async (context) => {
        assert.deepEqual(context.request.flags, {
          param: "b",
        });
        resolveHandler();
      },
      {
        cwd,
        entryFilePath,
        name: "runtime-cli",
        packageName: "@examples/runtime-cli",
        version: "1.2.3",
        runtime: {
          repeatedFlags: "last",
        },
      },
    );

    await handlerFinished;
  } finally {
    process.argv = previousArgv;
  }
});

test("initCli sets process exit code on errors", async () => {
  const previousArgv = process.argv;
  const previousExitCode = process.exitCode;
  const previousError = globalThis.console.error;
  const cwd = await mkdtemp(join(tmpdir(), "type-x-runtime-init-"));
  const entryFilePath = join(cwd, "dist/cli.js");
  const errorMessages = [];

  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify(
      {
        name: "@examples/runtime-cli",
        version: "1.2.3",
      },
      null,
      2,
    ) + "\n",
  );

  globalThis.console.error = (message) => {
    errorMessages.push(String(message));
  };
  process.argv = ["node", entryFilePath, "hello"];
  process.exitCode = undefined;

  try {
    initCli(
      async () => {
        throw new Error("boom");
      },
      {
        cwd,
        entryFilePath,
      },
    );

    await waitFor(() => process.exitCode === 1);

    assert.equal(process.exitCode, 1);
    assert.deepEqual(errorMessages, ["boom"]);
  } finally {
    globalThis.console.error = previousError;
    process.argv = previousArgv;
    process.exitCode = previousExitCode;
  }
});

test("initCli handles context.fail as a user-facing failure", async () => {
  const previousArgv = process.argv;
  const previousExitCode = process.exitCode;
  const previousError = globalThis.console.error;
  const cwd = await mkdtemp(join(tmpdir(), "type-x-runtime-fail-"));
  const entryFilePath = join(cwd, "dist/cli.js");
  const errorMessages = [];

  globalThis.console.error = (message) => {
    errorMessages.push(String(message));
  };
  process.argv = ["node", entryFilePath, "hello"];
  process.exitCode = undefined;

  try {
    initCli(
      (context) => {
        context.fail("Missing token", {
          exitCode: 2,
        });
      },
      {
        cwd,
        entryFilePath,
        name: "runtime-cli",
        packageName: "@examples/runtime-cli",
        version: "1.2.3",
      },
    );

    await waitFor(() => process.exitCode === 2);

    assert.equal(process.exitCode, 2);
    assert.deepEqual(errorMessages, ["Missing token"]);
  } finally {
    globalThis.console.error = previousError;
    process.argv = previousArgv;
    process.exitCode = previousExitCode;
  }
});

const restoreEnvVar = (name, value) => {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
};

const waitFor = async (predicate) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) {
      return;
    }

    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, 5);
    });
  }

  throw new Error("Timed out waiting for async condition.");
};
