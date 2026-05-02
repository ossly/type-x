import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";

import { createRequest } from "../dist/src/index.js";

test("createRequest parses argv, true positionals, flags, and pwd", () => {
  const originalCwd = process.cwd;

  process.cwd = () => "/tmp/request-test";

  try {
    const request = createRequest(
      ["--name", "codex", "-ab", "value", "--debug=true"],
      {
        invocationArgv: [
          "hello-dev",
          "--name",
          "codex",
          "-ab",
          "value",
          "--debug=true",
        ],
      },
    );

    assert.deepEqual(request.argv, [
      "--name",
      "codex",
      "-ab",
      "value",
      "--debug=true",
    ]);
    assert.equal(request.raw, "--name codex -ab value --debug=true");
    assert.deepEqual(request.args, ["value"]);
    assert.deepEqual(request.flags, {
      name: "codex",
      a: true,
      b: true,
      debug: "true",
    });
    assert.equal(
      request.invocation.raw,
      "hello-dev --name codex -ab value --debug=true",
    );
    assert.deepEqual(request.invocation.argv, [
      "hello-dev",
      "--name",
      "codex",
      "-ab",
      "value",
      "--debug=true",
    ]);
    assert.equal(request.pwd, "/tmp/request-test");
    assert.equal(request.env, process.env);
  } finally {
    process.cwd = originalCwd;
  }
});

test("createRequest supports short flags with values and preserves raw argv", () => {
  const request = createRequest(["-n", "codex", "--", "--literal"], {
    invocationArgv: ["hello-dev", "-n", "codex", "--", "--literal"],
  });

  assert.equal(request.raw, "-n codex -- --literal");
  assert.deepEqual(request.argv, ["-n", "codex", "--", "--literal"]);
  assert.deepEqual(request.args, ["--literal"]);
  assert.deepEqual(request.flags, {
    n: "codex",
  });
  assert.equal(request.invocation.raw, "hello-dev -n codex -- --literal");
  assert.deepEqual(request.invocation.argv, [
    "hello-dev",
    "-n",
    "codex",
    "--",
    "--literal",
  ]);
});

test("createRequest parses repeated flags as arrays", () => {
  const request = createRequest([
    "--param",
    "a",
    "--param",
    "b",
    "-n",
    "one",
    "-n",
    "two",
    "--verbose",
    "--verbose",
  ]);

  assert.deepEqual(request.flags, {
    param: ["a", "b"],
    n: ["one", "two"],
    verbose: [true, true],
  });
});

test("createRequest can parse repeated flags with last value winning", () => {
  const request = createRequest(
    ["--param", "a", "--param", "b", "-n", "one", "-n", "two"],
    {
      repeatedFlags: "last",
    },
  );

  assert.deepEqual(request.flags, {
    param: "b",
    n: "two",
  });
});
