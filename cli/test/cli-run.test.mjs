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
