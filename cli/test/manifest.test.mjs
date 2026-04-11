import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  getManifestCommand,
  readPackageManifest,
} from "../dist/src/runtime/manifest.js";

test("readPackageManifest returns validated package metadata", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-manifest-"));
  const packageDir = join(dir, "hello-tools");

  await mkdir(packageDir, { recursive: true });
  await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(
      {
        name: "@examples/hello-tools",
        version: "1.2.3",
        type: "module",
        x: {
          runtime: "1",
          commands: {
            hello: {
              entry: "./dist/hello.js",
              description: "Say hello",
            },
          },
        },
      },
      null,
      2,
    ),
  );

  const manifest = await readPackageManifest(packageDir);
  const command = getManifestCommand(manifest, "hello");

  assert.equal(manifest.packageName, "@examples/hello-tools");
  assert.equal(manifest.packageVersion, "1.2.3");
  assert.equal(command.entry, "./dist/hello.js");
  assert.equal(command.description, "Say hello");
});

test("readPackageManifest rejects invalid runtime", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-manifest-invalid-"));
  const packageDir = join(dir, "bad-tools");

  await mkdir(packageDir, { recursive: true });
  await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(
      {
        name: "@examples/bad-tools",
        version: "1.0.0",
        x: {
          runtime: "2",
          commands: {
            bad: {
              entry: "./dist/bad.js",
              description: "Bad runtime",
            },
          },
        },
      },
      null,
      2,
    ),
  );

  await assert.rejects(
    () => readPackageManifest(packageDir),
    /must define x\.runtime as "1"/,
  );
});
