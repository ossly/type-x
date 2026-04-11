import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

const execFileAsync = promisify(execFile);

test("x run executes a local package command", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-"));
  const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  const result = await execFileAsync(
    "node",
    [cliEntrypoint, "run", packagePath, "hello-dev", "--name", "codex"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(result.stdout, /hello from local package/);
  assert.match(result.stdout, /command: hello-dev/);
  assert.match(result.stdout, /@examples\/hello-tools@0.0.0/);
});

test("x add installs a package and x remove deletes it", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-add-remove-"));
  const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  const addResult = await execFileAsync(
    "node",
    [cliEntrypoint, "add", packagePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(addResult.stdout, /Installed @examples\/hello-tools@0.0.0/);

  const lsAfterAdd = await execFileAsync("node", [cliEntrypoint, "ls"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(lsAfterAdd.stdout, /hello-dev/);

  const removeResult = await execFileAsync(
    "node",
    [cliEntrypoint, "remove", "@examples/hello-tools"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(removeResult.stdout, /Removed @examples\/hello-tools\./);

  const lsAfterRemove = await execFileAsync("node", [cliEntrypoint, "ls"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(lsAfterRemove.stdout, /No installed commands\./);
});

test("x upgrade replaces an installed package version", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-upgrade-"));
  const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");
  const originalPackagePath = resolve(process.cwd(), "../examples/hello-tools");
  const upgradedPackageRoot = await mkdtemp(
    join(tmpdir(), "type-x-upgrade-package-"),
  );
  const upgradedPackagePath = join(upgradedPackageRoot, "hello-tools");

  await mkdir(join(upgradedPackagePath, "dist"), { recursive: true });
  await writeFile(
    join(upgradedPackagePath, "package.json"),
    JSON.stringify(
      {
        name: "@examples/hello-tools",
        version: "0.0.1",
        type: "module",
        x: {
          runtime: "1",
          commands: {
            "hello-dev": {
              entry: "./dist/hello.js",
              description: "Example upgraded command",
            },
          },
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(upgradedPackagePath, "dist/hello.js"),
    [
      "export default async function main(context) {",
      '  context.log.info("hello from upgraded package");',
      "  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);",
      "}",
      "",
    ].join("\n"),
  );

  await execFileAsync("node", [cliEntrypoint, "add", originalPackagePath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  const upgradeResult = await execFileAsync(
    "node",
    [cliEntrypoint, "upgrade", upgradedPackagePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(upgradeResult.stdout, /Upgraded @examples\/hello-tools to 0.0.1/);

  const runResult = await execFileAsync(
    "node",
    [cliEntrypoint, "hello-dev"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(runResult.stdout, /hello from upgraded package/);
  assert.match(runResult.stdout, /@examples\/hello-tools@0.0.1/);
});
