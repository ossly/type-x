import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
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
  await mkdir(join(packageDir, "dist"), { recursive: true });
  await writeFile(
    join(packageDir, "dist/hello.js"),
    'export default async function main() {}\n',
  );

  const manifest = await readPackageManifest(packageDir);
  const command = getManifestCommand(manifest, "hello");

  assert.equal(manifest.packageName, "@examples/hello-tools");
  assert.equal(manifest.packageVersion, "1.2.3");
  assert.equal(command.entry, "./dist/hello.js");
  assert.equal(command.description, "Say hello");
});

test("readPackageManifest rejects missing x manifest object", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-manifest-missing-x-"));
  const packageDir = join(dir, "bad-tools");

  await mkdir(packageDir, { recursive: true });
  await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(
      {
        name: "@examples/bad-tools",
        version: "1.0.0",
      },
      null,
      2,
    ),
  );

  await assert.rejects(
    () => readPackageManifest(packageDir),
    /expected "x" to be an object/,
  );
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
    /expected "x\.runtime" to be "1", received "2"/,
  );
});

test("readPackageManifest rejects missing commands object", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-manifest-missing-commands-"));
  const packageDir = join(dir, "bad-tools");

  await mkdir(packageDir, { recursive: true });
  await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(
      {
        name: "@examples/bad-tools",
        version: "1.0.0",
        x: {
          runtime: "1",
        },
      },
      null,
      2,
    ),
  );

  await assert.rejects(
    () => readPackageManifest(packageDir),
    /expected "x\.commands" to be an object/,
  );
});

test("readPackageManifest rejects empty command description", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-manifest-bad-description-"));
  const packageDir = join(dir, "bad-tools");

  await mkdir(join(packageDir, "dist"), { recursive: true });
  await writeFile(
    join(packageDir, "dist/hello.js"),
    'export default async function main() {}\n',
  );
  await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(
      {
        name: "@examples/bad-tools",
        version: "1.0.0",
        x: {
          runtime: "1",
          commands: {
            hello: {
              entry: "./dist/hello.js",
              description: "",
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
    /expected "x\.commands\.hello\.description" to be a non-empty string/,
  );
});

test("readPackageManifest rejects missing command entry file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-manifest-missing-entry-"));
  const packageDir = join(dir, "bad-tools");

  await mkdir(packageDir, { recursive: true });
  await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(
      {
        name: "@examples/bad-tools",
        version: "1.0.0",
        x: {
          runtime: "1",
          commands: {
            hello: {
              entry: "./dist/hello.js",
              description: "Missing file",
            },
          },
        },
      },
      null,
      2,
    ),
  );

  const missingEntryPath = resolve(packageDir, "dist/hello.js").replaceAll(
    "\\",
    "\\\\",
  );

  await assert.rejects(
    () => readPackageManifest(packageDir),
    new RegExp(`entry "\\./dist/hello\\.js" was not found at "${missingEntryPath}"`),
  );
});
