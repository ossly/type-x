import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";

import { createRequest } from "../dist/src/runtime/request.js";

test("createRequest parses argv, args, flags, and pwd", () => {
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
    assert.deepEqual(request.args, ["hello-dev", "codex", "value"]);
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
