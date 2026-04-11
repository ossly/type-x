import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

const execFileAsync = promisify(execFile);

test("x run executes a local package command", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-"));
  const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  const result = await execFileAsync(
    "node",
    [cliEntrypoint, "run", packagePath, "hello-dev", "--name", "codex"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(result.stdout, /hello from local package/);
  assert.match(result.stdout, /command: hello-dev/);
  assert.match(result.stdout, /@examples\/hello-tools@0.0.0/);
});

test("x add installs a package and x remove deletes it", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-add-remove-"));
  const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  const addResult = await execFileAsync(
    "node",
    [cliEntrypoint, "add", packagePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(addResult.stdout, /Installed @examples\/hello-tools@0.0.0/);

  const lsAfterAdd = await execFileAsync("node", [cliEntrypoint, "ls"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(lsAfterAdd.stdout, /hello-dev/);

  const removeResult = await execFileAsync(
    "node",
    [cliEntrypoint, "remove", "@examples/hello-tools"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(removeResult.stdout, /Removed @examples\/hello-tools\./);

  const lsAfterRemove = await execFileAsync("node", [cliEntrypoint, "ls"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(lsAfterRemove.stdout, /No installed commands\./);
});
