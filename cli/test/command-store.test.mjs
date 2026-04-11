import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

import {
  createCommandStore,
  getStoreFilePath,
} from "../dist/src/runtime/command-store.js";

test("command store persists values for a package command", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-command-store-"));
  const previousXHome = process.env.X_HOME;
  process.env.X_HOME = xHome;

  try {
    const store = createCommandStore("@examples/hello-tools", "hello");

    assert.equal(await store.get("runs"), undefined);
    assert.equal(await store.has("runs"), false);

    await store.set("runs", 1);
    await store.set("name", "codex");

    assert.equal(await store.get("runs"), 1);
    assert.equal(await store.has("runs"), true);
    assert.deepEqual(await store.all(), {
      runs: 1,
      name: "codex",
    });

    const storeFile = await getStoreFilePath("@examples/hello-tools", "hello");
    const content = await readFile(storeFile, "utf8");

    assert.match(content, /"runs": 1/);
    assert.match(content, /"name": "codex"/);
  } finally {
    restoreXHome(previousXHome);
  }
});

test("command store is isolated by package and command name", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-command-store-scope-"));
  const previousXHome = process.env.X_HOME;
  process.env.X_HOME = xHome;

  try {
    const packageStore = createCommandStore("@examples/hello-tools", "hello");
    const otherCommandStore = createCommandStore("@examples/hello-tools", "other");
    const otherPackageStore = createCommandStore("@examples/other-tools", "hello");

    await packageStore.set("runs", 2);
    await otherCommandStore.set("runs", 7);
    await otherPackageStore.set("runs", 11);

    assert.equal(await packageStore.get("runs"), 2);
    assert.equal(await otherCommandStore.get("runs"), 7);
    assert.equal(await otherPackageStore.get("runs"), 11);

    await packageStore.delete("runs");
    assert.equal(await packageStore.get("runs"), undefined);

    await otherCommandStore.clear();
    assert.deepEqual(await otherCommandStore.all(), {});
    assert.equal(await otherPackageStore.get("runs"), 11);
  } finally {
    restoreXHome(previousXHome);
  }
});

const restoreXHome = (value) => {
  if (value === undefined) {
    delete process.env.X_HOME;
    return;
  }

  process.env.X_HOME = value;
};
