import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createCommandStore,
  getStoreFilePath,
} from "../dist/src/index.js";

test("command store persists values for a package", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-runtime-store-"));
  const store = createCommandStore("@examples/hello-tools", homeDir);

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

  const storeFile = await getStoreFilePath("@examples/hello-tools", homeDir);
  const content = await readFile(storeFile, "utf8");

  assert.match(content, /"runs": 1/);
  assert.match(content, /"name": "codex"/);
});

test("command store is shared across commands in the same package", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-runtime-store-scope-"));
  const packageStore = createCommandStore("@examples/hello-tools", homeDir);
  const otherCommandStore = createCommandStore("@examples/hello-tools", homeDir);
  const otherPackageStore = createCommandStore("@examples/other-tools", homeDir);

  await packageStore.set("runs", 2);
  await otherCommandStore.set("name", "codex");
  await otherPackageStore.set("runs", 11);

  assert.equal(await packageStore.get("runs"), 2);
  assert.equal(await otherCommandStore.get("runs"), 2);
  assert.equal(await packageStore.get("name"), "codex");
  assert.equal(await otherPackageStore.get("runs"), 11);

  await packageStore.delete("runs");
  assert.equal(await packageStore.get("runs"), undefined);
  assert.equal(await otherCommandStore.get("runs"), undefined);

  await otherCommandStore.clear();
  assert.deepEqual(await otherCommandStore.all(), {});
  assert.equal(await otherPackageStore.get("runs"), 11);
});
