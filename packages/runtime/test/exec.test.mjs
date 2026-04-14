import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";

import { createCommandExec } from "../dist/src/index.js";

test("createCommandExec runs a command and captures stdout", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec('node -e \'process.stdout.write("ok")\'');

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
    'node -e \'process.stderr.write("bad"); process.exit(3)\'',
    { throwOnError: false },
  );

  assert.equal(result.exitCode, 3);
  assert.equal(result.stderr, "bad");
});

test("createCommandExec writes through to stdio when silent is false", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const stdoutChunks = [];
  const stderrChunks = [];

  process.stdout.write = ((chunk, encoding, callback) => {
    stdoutChunks.push(String(chunk));
    return originalStdoutWrite("", encoding, callback);
  });
  process.stderr.write = ((chunk, encoding, callback) => {
    stderrChunks.push(String(chunk));
    return originalStderrWrite("", encoding, callback);
  });

  try {
    const result = await exec(
      'node -e \'process.stdout.write("out"); process.stderr.write("err")\'',
      { silent: false },
    );

    assert.equal(result.stdout, "out");
    assert.equal(result.stderr, "err");
    assert.match(stdoutChunks.join(""), /out/);
    assert.match(stderrChunks.join(""), /err/);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
});
