import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { loadCommand } from "../dist/src/runtime/load-command.js";

test("loadCommand loads a default-exported command function", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-load-command-"));
  const file = join(dir, "hello.js");

  await writeFile(
    file,
    'export default async function main() { return "ok"; }\n',
  );

  const handler = await loadCommand(file);

  assert.equal(typeof handler, "function");
});

test("loadCommand rejects modules without a default function", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-load-command-invalid-"));
  const file = join(dir, "bad.js");

  await writeFile(file, 'export const nope = "bad";\n');

  await assert.rejects(
    () => loadCommand(file),
    /must export a default function/,
  );
});
