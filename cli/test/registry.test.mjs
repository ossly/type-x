import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

import {
  createEmptyRegistry,
  readRegistry,
  writeRegistry,
} from "../dist/src/runtime/registry.js";

test("readRegistry returns empty registry when file is missing", async () => {
  const home = await mkdtemp(join(tmpdir(), "type-x-registry-empty-"));
  const previousHome = process.env.X_HOME;

  process.env.X_HOME = home;

  try {
    const registry = await readRegistry();
    assert.deepEqual(registry, createEmptyRegistry());
  } finally {
    restoreEnv("X_HOME", previousHome);
  }
});

test("writeRegistry persists registry data", async () => {
  const home = await mkdtemp(join(tmpdir(), "type-x-registry-write-"));
  const previousHome = process.env.X_HOME;

  process.env.X_HOME = home;

  try {
    const registry = createEmptyRegistry();
    registry.packages["@examples/hello-tools"] = {
      name: "@examples/hello-tools",
      version: "1.0.0",
      path: "/tmp/hello-tools",
      commands: ["hello-dev"],
      source: {
        kind: "npm",
        specifier: "@examples/hello-tools",
        registryUrl: "https://npm.pkg.github.com/",
        scope: "@examples",
        tokenEnvName: "GITHUB_TOKEN",
      },
    };
    registry.commands["hello-dev"] = {
      packageName: "@examples/hello-tools",
      packageVersion: "1.0.0",
      entry: "./dist/hello.js",
      description: "Example command",
    };

    await writeRegistry(registry);

    const loadedRegistry = await readRegistry();
    assert.deepEqual(loadedRegistry, registry);
  } finally {
    restoreEnv("X_HOME", previousHome);
  }
});

const restoreEnv = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};
