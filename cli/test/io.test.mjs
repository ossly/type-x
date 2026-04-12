import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { createCommandIo } from "../dist/src/runtime/io.js";

test("createCommandIo.expandPath expands ~ and resolves relative paths", () => {
  const io = createCommandIo({
    cwd: "/tmp/type-x-io",
  });

  assert.equal(
    io.expandPath("~/Downloads/file.txt"),
    join(homedir(), "Downloads/file.txt"),
  );
  assert.equal(io.expandPath("nested/file.txt"), "/tmp/type-x-io/nested/file.txt");
});

test("createCommandIo.download downloads using filename inferred from url", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "type-x-io-download-"));
  const io = createCommandIo({ cwd });

  await withFetchStub(
    async () =>
      new globalThis.Response("hello", {
        status: 200,
        statusText: "OK",
      }),
    async () => {
      const result = await io.download("https://example.com/archive.txt");
      const content = await readFile(result.path, "utf8");

      assert.equal(result.fileName, "archive.txt");
      assert.equal(result.path, join(cwd, "archive.txt"));
      assert.equal(content, "hello");
    },
  );
});

test("createCommandIo.download supports destination directories and explicit file names", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "type-x-io-download-dest-"));
  const io = createCommandIo({ cwd });

  await withFetchStub(
    async () =>
      new globalThis.Response("payload", {
        status: 200,
        statusText: "OK",
      }),
    async () => {
      const destinationDir = join(cwd, "downloads");
      const result = await io.download("https://example.com/tool.bin", {
        destination: destinationDir,
        fileName: "custom.bin",
      });

      assert.equal(result.path, join(destinationDir, "custom.bin"));
      assert.equal(await readFile(result.path, "utf8"), "payload");
    },
  );
});

test("createCommandIo.download rejects when destination exists without overwrite", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "type-x-io-download-overwrite-"));
  const io = createCommandIo({ cwd });
  const targetFile = join(cwd, "existing.txt");

  await writeFile(targetFile, "old", "utf8");

  await assert.rejects(
    () =>
      io.download("https://example.com/file.txt", {
        destination: targetFile,
      }),
    /Download destination already exists/,
  );
});

const withFetchStub = async (fetchImpl, fn) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;

  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
};
