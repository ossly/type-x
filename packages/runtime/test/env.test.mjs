import test from "node:test";
import assert from "node:assert/strict";

import { createCommandEnv } from "../dist/src/index.js";

test("createCommandEnv.get returns defined values and hides empty values", () => {
  const env = createCommandEnv({
    TOKEN: "secret",
    EMPTY: "",
  });

  assert.equal(env.get("TOKEN"), "secret");
  assert.equal(env.get("EMPTY"), undefined);
  assert.equal(env.get("MISSING"), undefined);
});

test("createCommandEnv.has returns true only for non-empty values", () => {
  const env = createCommandEnv({
    TOKEN: "secret",
    EMPTY: "",
    ZERO: "0",
  });

  assert.equal(env.has("TOKEN"), true);
  assert.equal(env.has("ZERO"), true);
  assert.equal(env.has("EMPTY"), false);
  assert.equal(env.has("MISSING"), false);
});

test("createCommandEnv.require returns values and throws for missing or empty ones", () => {
  const env = createCommandEnv({
    TOKEN: "secret",
    EMPTY: "",
  });

  assert.equal(env.require("TOKEN"), "secret");
  assert.throws(
    () => env.require("EMPTY"),
    /Missing required environment variable: EMPTY/,
  );
  assert.throws(
    () => env.require("MISSING"),
    /Missing required environment variable: MISSING/,
  );
});
