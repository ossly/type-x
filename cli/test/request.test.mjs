import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";

import { createRequest } from "../dist/src/runtime/request.js";

test("createRequest parses argv, true positionals, flags, and pwd", () => {
  const originalCwd = process.cwd;

  process.cwd = () => "/tmp/request-test";

  try {
    const request = createRequest([
      "hello-dev",
      "--name",
      "codex",
      "-ab",
      "value",
      "--debug=true",
    ]);

    assert.equal(request.raw, "hello-dev --name codex -ab value --debug=true");
    assert.deepEqual(request.argv, [
      "hello-dev",
      "--name",
      "codex",
      "-ab",
      "value",
      "--debug=true",
    ]);
    assert.deepEqual(request.args, ["hello-dev", "value"]);
    assert.deepEqual(request.flags, {
      name: "codex",
      a: true,
      b: true,
      debug: "true",
    });
    assert.equal(request.pwd, "/tmp/request-test");
    assert.equal(request.env, process.env);
  } finally {
    process.cwd = originalCwd;
  }
});

test("createRequest supports short flags with values and preserves raw argv", () => {
  const request = createRequest(["hello-dev", "-n", "codex", "--", "--literal"]);

  assert.equal(request.raw, "hello-dev -n codex -- --literal");
  assert.deepEqual(request.argv, ["hello-dev", "-n", "codex", "--", "--literal"]);
  assert.deepEqual(request.args, ["hello-dev", "--literal"]);
  assert.deepEqual(request.flags, {
    n: "codex",
  });
});
