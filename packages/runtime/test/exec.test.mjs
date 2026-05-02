import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";

import {
  CommandExecError,
  createCommandExec,
  isCommandExecError,
} from "../dist/src/index.js";

test("createCommandExec runs a command and captures stdout", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec("node -e 'process.stdout.write(\"ok\")'");

  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, "ok");
  assert.equal(result.stderr, "");
});

test("createCommandExec supports argv commands without shell interpolation", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec(
    [
      "node",
      "-e",
      "process.stdout.write(process.argv[1])",
      "hello && not-a-command",
    ],
    {
      silent: true,
    },
  );

  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, "hello && not-a-command");
  assert.equal(result.stderr, "");
});

test("createCommandExec can return non-zero results without rejecting", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec(
    "node -e 'process.stderr.write(\"bad\"); process.exit(3)'",
    { throwOnError: false },
  );

  assert.equal(result.exitCode, 3);
  assert.equal(result.stderr, "bad");
});

test("createCommandExec throws a structured error by default", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  await assert.rejects(
    () =>
      exec("node -e 'process.stderr.write(\"bad\"); process.exit(3)'", {
        silent: true,
      }),
    (error) => {
      assert.equal(error instanceof CommandExecError, true);
      assert.match(error.message, /^Command ".+" exited with code 3$/);
      assert.equal(error.name, "CommandExecError");
      assert.equal(error.code, "COMMAND_EXEC_ERROR");
      assert.equal(
        error.command,
        "node -e 'process.stderr.write(\"bad\"); process.exit(3)'",
      );
      assert.equal(error.exitCode, 3);
      assert.equal(error.stdout, "");
      assert.equal(error.stderr, "bad");
      assert.equal(error.combinedOutput, "bad");
      assert.equal(error.cwd, process.cwd());
      assert.equal(error.mode, "capture");
      return true;
    },
  );
});

test("createCommandExec includes argv command display in structured errors", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  await assert.rejects(
    () =>
      exec(["node", "-e", "process.stderr.write('bad'); process.exit(4)"], {
        silent: true,
      }),
    (error) => {
      assert.equal(error instanceof CommandExecError, true);
      assert.equal(
        error.command,
        "node -e 'process.stderr.write('\\''bad'\\''); process.exit(4)'",
      );
      assert.equal(error.exitCode, 4);
      assert.equal(error.stderr, "bad");
      return true;
    },
  );
});

test("isCommandExecError narrows structured exec errors", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  try {
    await exec("node -e 'process.stderr.write(\"bad\"); process.exit(3)'", {
      silent: true,
    });
    assert.fail("Expected exec to throw");
  } catch (error) {
    assert.equal(isCommandExecError(error), true);

    if (!isCommandExecError(error)) {
      assert.fail("Expected error to narrow as a command exec error");
    }

    assert.equal(error.exitCode, 3);
    assert.equal(error.stderr, "bad");
    assert.equal(
      error.command,
      "node -e 'process.stderr.write(\"bad\"); process.exit(3)'",
    );
  }
});

test("isCommandExecError rejects non-exec errors", () => {
  assert.equal(isCommandExecError(new Error("plain")), false);
  assert.equal(isCommandExecError({ code: "COMMAND_EXEC_ERROR" }), false);
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

  process.stdout.write = (chunk, encoding, callback) => {
    stdoutChunks.push(String(chunk));
    return originalStdoutWrite("", encoding, callback);
  };
  process.stderr.write = (chunk, encoding, callback) => {
    stderrChunks.push(String(chunk));
    return originalStderrWrite("", encoding, callback);
  };

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

test("createCommandExec can inherit stdio for interactive commands", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  const result = await exec("node -e 'process.exit(0)'", {
    mode: "inherit",
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

test("createCommandExec rejects input in inherit mode", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  await assert.rejects(
    () =>
      exec("node -e 'process.exit(0)'", {
        mode: "inherit",
        input: "secret\n",
      }),
    /cannot use `input` when `mode` is "inherit"/,
  );
});

test("createCommandExec rejects silent mode in inherit mode", async () => {
  const exec = createCommandExec({
    cwd: process.cwd(),
    env: process.env,
  });

  await assert.rejects(
    () =>
      exec("node -e 'process.exit(0)'", {
        mode: "inherit",
        silent: true,
      }),
    /cannot use `silent: true` when `mode` is "inherit"/,
  );
});
