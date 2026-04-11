import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";

import { createCommandExec } from "../dist/src/runtime/exec.js";

test("createCommandExec runs a command and captures stdout", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec("node", ["-e", 'process.stdout.write("ok")']);

  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, "ok");
  assert.equal(result.stderr, "");
});

test("createCommandExec can return non-zero results without rejecting", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec(
    "node",
    ["-e", 'process.stderr.write("bad"); process.exit(3)'],
    { rejectOnNonZero: false },
  );

  assert.equal(result.exitCode, 3);
  assert.equal(result.stderr, "bad");
});
