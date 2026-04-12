import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { readFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);
const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");

test("x run executes a local package command", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-"));
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
  assert.match(result.stdout, /runs: 1/);
});

test("x run executes the TypeScript example package", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-ts-"));
  const packagePath = resolve(process.cwd(), "../examples/hello-tools-ts");

  const result = await execFileAsync(
    "node",
    [cliEntrypoint, "run", packagePath, "hello-ts", "--name", "itaibo"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(result.stdout, /hello from typed package/);
  assert.match(result.stdout, /command: hello-ts/);
  assert.match(result.stdout, /@examples\/hello-tools-ts@0.0.0/);
  assert.match(result.stdout, /runs: 1/);
  assert.match(result.stdout, /name: itaibo/);
  assert.match(result.stdout, /storedName: itaibo/);
});

test("x add installs a package and x remove deletes it", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-add-remove-"));
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
  assert.match(addResult.stdout, /\[ \] Installing/);
  assert.match(addResult.stdout, /\[ \] Packing package:/);
  assert.match(addResult.stdout, /\[ok\] Installed @examples\/hello-tools@0.0.0/);
  assert.match(addResult.stdout, /COMMAND\s+PACKAGE\s+VERSION\s+DESCRIPTION/);
  assert.match(addResult.stdout, /hello-dev\s+@examples\/hello-tools\s+0.0.0\s+Example local development command/);

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
  assert.match(removeResult.stdout, /\[ok\] Removed @examples\/hello-tools/);

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
      '  const previousRuns = (await context.store.get("runs")) ?? 0;',
      "  const runs = Number(previousRuns) + 1;",
      '  await context.store.set("runs", runs);',
      '  context.log.info("hello from upgraded package");',
      "  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);",
      "  context.log.info(`runs: ${runs}`);",
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

  const initialRunResult = await execFileAsync(
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

  assert.match(initialRunResult.stdout, /runs: 1/);

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
  assert.match(upgradeResult.stdout, /\[ \] Upgrading/);
  assert.match(upgradeResult.stdout, /\[ \] Replacing installed package:/);
  assert.match(upgradeResult.stdout, /\[ok\] Upgraded @examples\/hello-tools to 0.0.1/);

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
  assert.match(runResult.stdout, /runs: 2/);
});

test("x alias creates an alias that executes the target command and x unalias removes it", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-alias-"));
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  await execFileAsync("node", [cliEntrypoint, "add", packagePath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  const aliasResult = await execFileAsync(
    "node",
    [cliEntrypoint, "alias", "hi=hello-dev"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(aliasResult.stdout, /Created alias hi -> hello-dev\./);
  assert.match(aliasResult.stdout, /Run "x setup-shell" to add it to/);

  const aliasesResult = await execFileAsync(
    "node",
    [cliEntrypoint, "aliases"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(aliasesResult.stdout, /ALIAS\s+COMMAND/);
  assert.match(aliasesResult.stdout, /hi\s+hello-dev/);

  const aliasRunResult = await execFileAsync("node", [cliEntrypoint, "hi"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(aliasRunResult.stdout, /hello from local package/);
  assert.match(aliasRunResult.stdout, /command: hello-dev/);

  const unaliasResult = await execFileAsync(
    "node",
    [cliEntrypoint, "unalias", "hi"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(unaliasResult.stdout, /Removed alias hi\./);

  await assert.rejects(
    () =>
      execFileAsync("node", [cliEntrypoint, "hi"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          X_HOME: xHome,
        },
      }),
    /Command not found: hi/,
  );
});

test("x alias allows exposing an installed command under the same global name", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-alias-same-name-"));
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  await execFileAsync("node", [cliEntrypoint, "add", packagePath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  const aliasResult = await execFileAsync(
    "node",
    [cliEntrypoint, "alias", "hello-dev=hello-dev"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(aliasResult.stdout, /Created alias hello-dev -> hello-dev\./);

  const directRunResult = await execFileAsync(
    "node",
    [cliEntrypoint, "hello-dev", "--name", "codex"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(directRunResult.stdout, /hello from local package/);
  assert.match(directRunResult.stdout, /command: hello-dev/);
});

test("x setup-shell adds ~/.x/bin to the detected shell rc file", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-shell-home-"));
  const xHome = join(homeDir, ".x");
  const rcFile = join(homeDir, ".zshrc");

  const result = await execFileAsync("node", [cliEntrypoint, "setup-shell"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: homeDir,
      SHELL: "/bin/zsh",
      PATH: process.env.PATH,
      X_HOME: xHome,
    },
  });

  assert.match(result.stdout, /Added .*\.x\/bin to PATH in .*\.zshrc\./);

  const rcContent = await import("node:fs/promises").then(({ readFile }) =>
    readFile(rcFile, "utf8"),
  );

  assert.match(rcContent, /export PATH="\$HOME\/\.x\/bin:\$PATH"/);
});

test("command store persists across repeated installed command runs", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-store-"));
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  await execFileAsync("node", [cliEntrypoint, "add", packagePath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  const firstRun = await execFileAsync("node", [cliEntrypoint, "hello-dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  const secondRun = await execFileAsync("node", [cliEntrypoint, "hello-dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(firstRun.stdout, /runs: 1/);
  assert.match(secondRun.stdout, /runs: 2/);
});

test("x --help prints usage and command list", async () => {
  const result = await execFileAsync("node", [cliEntrypoint, "--help"], {
    cwd: process.cwd(),
    env: process.env,
  });

  assert.match(result.stdout, /x - installable command runtime/);
  assert.match(result.stdout, /Usage/);
  assert.match(result.stdout, /Internal commands/);
  assert.match(result.stdout, /init \[path\] \[--ts\]/);
  assert.match(result.stdout, /add <package-name-or-path>/);
  assert.match(result.stdout, /doctor/);
});

test("x --version prints the cli package version", async () => {
  const packageJson = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8"),
  );

  const result = await execFileAsync("node", [cliEntrypoint, "--version"], {
    cwd: process.cwd(),
    env: process.env,
  });

  assert.equal(result.stdout.trim(), packageJson.version);
});

test("x init --ts scaffolds a TypeScript package", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "type-x-init-ts-"));
  const targetDir = join(projectDir, "my-command");

  const result = await execFileAsync(
    "node",
    [cliEntrypoint, "init", targetDir, "--ts"],
    {
      cwd: process.cwd(),
      env: process.env,
    },
  );

  assert.match(result.stdout, /Initialized TypeScript x package/);
  assert.match(result.stdout, /pnpm build/);
  assert.match(result.stdout, /x run \. my-command/);

  const fs = await import("node:fs/promises");
  const packageJson = JSON.parse(
    await fs.readFile(join(targetDir, "package.json"), "utf8"),
  );
  const tsconfig = JSON.parse(
    await fs.readFile(join(targetDir, "tsconfig.json"), "utf8"),
  );
  const source = await fs.readFile(join(targetDir, "src/index.ts"), "utf8");

  assert.equal(packageJson.name, "my-command");
  assert.equal(packageJson.x.commands["my-command"].entry, "./dist/src/index.js");
  assert.equal(packageJson.devDependencies["@type-x/typescript-config"], undefined);
  assert.equal(tsconfig.extends, undefined);
  assert.deepEqual(tsconfig.compilerOptions.lib, ["es2022"]);
  assert.deepEqual(tsconfig.compilerOptions.types, ["node"]);
  assert.match(source, /CommandContext/);
});

test("x doctor reports shell and registry status", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-cli-doctor-home-"));
  const xHome = join(homeDir, ".x");
  const packagePath = resolve(process.cwd(), "../examples/hello-tools");

  await execFileAsync("node", [cliEntrypoint, "add", packagePath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: homeDir,
      SHELL: "/bin/zsh",
      PATH: process.env.PATH,
      X_HOME: xHome,
    },
  });

  const result = await execFileAsync("node", [cliEntrypoint, "doctor"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: homeDir,
      SHELL: "/bin/zsh",
      PATH: process.env.PATH,
      X_HOME: xHome,
    },
  });

  assert.match(result.stdout, /Paths/);
  assert.match(result.stdout, /Shell/);
  assert.match(result.stdout, /Registry/);
  assert.match(result.stdout, /Git/);
  assert.match(result.stdout, /packages: 1/);
  assert.match(result.stdout, /commands: 1/);
  assert.match(result.stdout, /aliases: 0/);
  assert.match(result.stdout, /isRepository: yes/);
  assert.match(result.stdout, /repoName: type-x/);
});
