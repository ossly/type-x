import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

const execFileAsync = promisify(execFile);
const cliEntrypoint = resolve(process.cwd(), "dist/src/cli.js");

test("x run executes a local package command", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-"));
  const { packagePath, packageName } = await createJavaScriptFixturePackage();

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
  assert.match(
    result.stdout,
    new RegExp(`${escapeRegExp(packageName)}@0\\.0\\.0`),
  );
  assert.match(result.stdout, /runs: 1/);
});

test("x run executes a TypeScript package", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-ts-"));
  const { packagePath, packageName } = await createTypeScriptFixturePackage();

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
  assert.match(
    result.stdout,
    new RegExp(`${escapeRegExp(packageName)}@0\\.0\\.0`),
  );
  assert.match(result.stdout, /runs: 1/);
  assert.match(result.stdout, /name: itaibo/);
  assert.match(result.stdout, /storedName: itaibo/);
});

test("x run applies command runtime repeated flag options", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-run-runtime-"));
  const { packagePath } = await createJavaScriptFixturePackage({
    runtime: {
      repeatedFlags: "last",
    },
  });

  const result = await execFileAsync(
    "node",
    [
      cliEntrypoint,
      "run",
      packagePath,
      "hello-dev",
      "--name",
      "first",
      "--name",
      "second",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(result.stdout, /name: second/);
});

test("x add installs a package and x remove deletes it", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-add-remove-"));
  const { packagePath, packageName } = await createJavaScriptFixturePackage();

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

  assert.match(
    addResult.stdout,
    new RegExp(`Installed ${escapeRegExp(packageName)}@0\\.0\\.0`),
  );
  assert.match(addResult.stdout, /\[ \] Installing/);
  assert.match(addResult.stdout, /\[ \] Packing package:/);
  assert.match(
    addResult.stdout,
    new RegExp(`\\[ok\\] Installed ${escapeRegExp(packageName)}@0\\.0\\.0`),
  );
  assert.match(addResult.stdout, /COMMAND\s+PACKAGE\s+VERSION\s+DESCRIPTION/);
  assert.match(
    addResult.stdout,
    new RegExp(
      `hello-dev\\s+${escapeRegExp(packageName)}\\s+0\\.0\\.0\\s+Example local development command`,
    ),
  );

  const lsAfterAdd = await execFileAsync("node", [cliEntrypoint, "ls"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(lsAfterAdd.stdout, /hello-dev/);

  await execFileAsync("node", [cliEntrypoint, "alias", "hi=hello-dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  await execFileAsync("node", [cliEntrypoint, "hello-dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  const storeFilePath = join(xHome, "stores", getStoreFileName(packageName));
  await access(storeFilePath);

  const removeResult = await execFileAsync(
    "node",
    [cliEntrypoint, "remove", packageName],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(
    removeResult.stdout,
    new RegExp(`Removed ${escapeRegExp(packageName)}\\.`),
  );
  assert.match(
    removeResult.stdout,
    new RegExp(`\\[ok\\] Removed ${escapeRegExp(packageName)}`),
  );

  const lsAfterRemove = await execFileAsync("node", [cliEntrypoint, "ls"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(lsAfterRemove.stdout, /No installed commands\./);

  const aliasesAfterRemove = await execFileAsync(
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

  assert.match(aliasesAfterRemove.stdout, /No aliases configured\./);

  const aliasShimPath = join(xHome, "bin", "hi");
  await assert.rejects(() => access(aliasShimPath));
  await assert.rejects(() => access(storeFilePath));

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

test("x upgrade replaces an installed package version", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-upgrade-"));
  const originalPackage = await createJavaScriptFixturePackage();
  const upgradedPackage = await createJavaScriptFixturePackage({
    packageName: originalPackage.packageName,
    version: "0.0.1",
    description: "Example upgraded command",
    greeting: "hello from upgraded package",
  });

  await execFileAsync(
    "node",
    [cliEntrypoint, "add", originalPackage.packagePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

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
    [cliEntrypoint, "upgrade", upgradedPackage.packagePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(
    upgradeResult.stdout,
    new RegExp(
      `Upgraded ${escapeRegExp(originalPackage.packageName)} to 0\\.0\\.1`,
    ),
  );
  assert.match(upgradeResult.stdout, /\[ \] Upgrading/);
  assert.match(upgradeResult.stdout, /\[ \] Replacing installed package:/);
  assert.match(
    upgradeResult.stdout,
    new RegExp(
      `\\[ok\\] Upgraded ${escapeRegExp(originalPackage.packageName)} to 0\\.0\\.1`,
    ),
  );

  const runResult = await execFileAsync("node", [cliEntrypoint, "hello-dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(runResult.stdout, /hello from upgraded package/);
  assert.match(
    runResult.stdout,
    new RegExp(`${escapeRegExp(originalPackage.packageName)}@0\\.0\\.1`),
  );
  assert.match(runResult.stdout, /runs: 2/);
});

test("x add persists source metadata for later upgrades", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-source-metadata-"));
  const { packagePath, packageName } = await createJavaScriptFixturePackage();

  await execFileAsync(
    "node",
    [
      cliEntrypoint,
      "add",
      packagePath,
      "--registry",
      "https://npm.pkg.github.com",
      "--scope",
      "@acme",
      "--token-env",
      "GITHUB_TOKEN",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  const registry = JSON.parse(
    await readFile(join(xHome, "registry.json"), "utf8"),
  );

  assert.deepEqual(registry.packages[packageName].source, {
    kind: "local",
    specifier: packagePath,
    registryUrl: "https://npm.pkg.github.com",
    scope: "@acme",
    tokenEnvName: "GITHUB_TOKEN",
  });
});

test("x upgrade can reuse stored package source metadata", async () => {
  const xHome = await mkdtemp(
    join(tmpdir(), "type-x-cli-upgrade-stored-source-"),
  );
  const originalPackage = await createJavaScriptFixturePackage();
  const upgradedPackage = await createJavaScriptFixturePackage({
    packageName: originalPackage.packageName,
    version: "0.0.1",
    greeting: "hello from stored-source upgrade",
  });

  await execFileAsync(
    "node",
    [cliEntrypoint, "add", originalPackage.packagePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  const registryPath = join(xHome, "registry.json");
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  registry.packages[originalPackage.packageName].source = {
    kind: "local",
    specifier: upgradedPackage.packagePath,
  };
  await writeFile(
    registryPath,
    JSON.stringify(registry, null, 2) + "\n",
    "utf8",
  );

  const upgradeResult = await execFileAsync(
    "node",
    [cliEntrypoint, "upgrade", originalPackage.packageName],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        X_HOME: xHome,
      },
    },
  );

  assert.match(
    upgradeResult.stdout,
    new RegExp(
      `Upgraded ${escapeRegExp(originalPackage.packageName)} to 0\\.0\\.1`,
    ),
  );

  const runResult = await execFileAsync("node", [cliEntrypoint, "hello-dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      X_HOME: xHome,
    },
  });

  assert.match(runResult.stdout, /hello from stored-source upgrade/);
  assert.match(runResult.stdout, /@test\/hello-tools@0\.0\.1/);
});

test("x alias creates an alias that executes the target command and x unalias removes it", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-alias-"));
  const { packagePath } = await createJavaScriptFixturePackage();

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
  const { packagePath } = await createJavaScriptFixturePackage();

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

test("x setup-shell adds the default x bin dir to the detected shell rc file", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-shell-home-"));
  const rcFile = join(homeDir, ".zshrc");

  const result = await execFileAsync("node", [cliEntrypoint, "setup-shell"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: homeDir,
      SHELL: "/bin/zsh",
      PATH: process.env.PATH,
    },
  });

  assert.match(
    result.stdout,
    /Added .*\.type-x\/type-x__cli\/bin to PATH in .*\.zshrc\./,
  );

  const rcContent = await import("node:fs/promises").then(({ readFile }) =>
    readFile(rcFile, "utf8"),
  );

  assert.match(
    rcContent,
    /export PATH="\$HOME\/\.type-x\/type-x__cli\/bin:\$PATH"/,
  );
});

test("x setup-shell uses the configured X_HOME bin path", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-shell-custom-home-"));
  const xHome = join(homeDir, ".custom-x-home");
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

  assert.match(
    result.stdout,
    /Added .*\.custom-x-home\/bin to PATH in .*\.zshrc\./,
  );

  const rcContent = await import("node:fs/promises").then(({ readFile }) =>
    readFile(rcFile, "utf8"),
  );

  assert.match(
    rcContent,
    new RegExp(`export PATH='${escapeRegExp(join(xHome, "bin"))}':\\$PATH`),
  );
});

test("command store persists across repeated installed command runs", async () => {
  const xHome = await mkdtemp(join(tmpdir(), "type-x-cli-store-"));
  const { packagePath } = await createJavaScriptFixturePackage();

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
  assert.match(result.stdout, /init \[path\] \[--standalone\]/);
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

test("x init scaffolds a TypeScript x package", async () => {
  const cliPackageJson = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8"),
  );
  const projectDir = await mkdtemp(join(tmpdir(), "type-x-init-x-"));
  const targetDir = join(projectDir, "my-command");

  const result = await execFileAsync(
    "node",
    [
      cliEntrypoint,
      "init",
      targetDir,
      "--package-name",
      "@acme/my-command",
      "--command-name",
      "hello-x",
    ],
    {
      cwd: process.cwd(),
      env: process.env,
    },
  );

  assert.match(result.stdout, /Initialized TypeScript x package/);
  assert.match(result.stdout, /pnpm build/);
  assert.match(result.stdout, /x run \. hello-x/);

  const fs = await import("node:fs/promises");
  const packageJson = JSON.parse(
    await fs.readFile(join(targetDir, "package.json"), "utf8"),
  );
  const tsconfig = JSON.parse(
    await fs.readFile(join(targetDir, "tsconfig.json"), "utf8"),
  );
  const source = await fs.readFile(join(targetDir, "src/index.ts"), "utf8");
  const readme = await fs.readFile(join(targetDir, "README.md"), "utf8");
  const gitignore = await fs.readFile(join(targetDir, ".gitignore"), "utf8");

  assert.equal(packageJson.name, "@acme/my-command");
  assert.equal(packageJson.x.commands["hello-x"].entry, "./dist/src/index.js");
  assert.equal(
    packageJson.x.commands["hello-x"].description,
    "Say hello from hello-x",
  );
  assert.deepEqual(packageJson.x.commands["hello-x"].runtime, {
    repeatedFlags: "array",
  });
  assert.equal(
    packageJson.devDependencies["@type-x/typescript-config"],
    undefined,
  );
  assert.equal(
    packageJson.devDependencies["@type-x/types"],
    cliPackageJson.version,
  );
  assert.equal(tsconfig.extends, undefined);
  assert.deepEqual(tsconfig.compilerOptions.lib, ["es2022"]);
  assert.deepEqual(tsconfig.compilerOptions.types, ["node"]);
  assert.match(source, /CommandContext/);
  assert.match(source, /hello from hello-x/);
  assert.match(readme, /@acme\/my-command/);
  assert.match(readme, /hello-x/);
  assert.match(gitignore, /node_modules/);
  assert.match(gitignore, /\.type-x/);
});

test("x init --standalone scaffolds a standalone TypeScript CLI", async () => {
  const cliPackageJson = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8"),
  );
  const projectDir = await mkdtemp(join(tmpdir(), "type-x-init-standalone-"));
  const targetDir = join(projectDir, "my-standalone");

  const result = await execFileAsync(
    "node",
    [
      cliEntrypoint,
      "init",
      targetDir,
      "--standalone",
      "--package-name",
      "@acme/hello-standalone",
      "--command-name",
      "hello-standalone",
    ],
    {
      cwd: process.cwd(),
      env: process.env,
    },
  );

  assert.match(result.stdout, /Initialized standalone TypeScript CLI/);
  assert.match(result.stdout, /pnpm build/);
  assert.match(result.stdout, /node dist\/src\/index\.js/);

  const fs = await import("node:fs/promises");
  const packageJson = JSON.parse(
    await fs.readFile(join(targetDir, "package.json"), "utf8"),
  );
  const tsconfig = JSON.parse(
    await fs.readFile(join(targetDir, "tsconfig.json"), "utf8"),
  );
  const source = await fs.readFile(join(targetDir, "src/index.ts"), "utf8");
  const readme = await fs.readFile(join(targetDir, "README.md"), "utf8");

  assert.equal(packageJson.name, "@acme/hello-standalone");
  assert.equal(packageJson.bin["hello-standalone"], "./dist/src/index.js");
  assert.equal(
    packageJson.dependencies["@type-x/runtime"],
    cliPackageJson.version,
  );
  assert.equal(packageJson.x, undefined);
  assert.equal(tsconfig.extends, undefined);
  assert.deepEqual(tsconfig.compilerOptions.types, ["node"]);
  assert.match(source, /initCli/);
  assert.match(source, /hello from hello-standalone/);
  assert.match(readme, /@type-x\/runtime/);
  assert.match(readme, /hello-standalone/);
});

test("x init fails before writing files when a template file already exists", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "type-x-init-existing-"));
  const targetDir = join(projectDir, "my-command");

  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, "README.md"), "# existing\n", "utf8");

  await assert.rejects(
    () =>
      execFileAsync("node", [cliEntrypoint, "init", targetDir], {
        cwd: process.cwd(),
        env: process.env,
      }),
    /Cannot initialize project because .*README\.md.* already exists\./,
  );

  await assert.rejects(() => access(join(targetDir, "package.json")));
  await assert.rejects(() => access(join(targetDir, "tsconfig.json")));
  await assert.rejects(() => access(join(targetDir, "src", "index.ts")));
});

test("x doctor reports shell and registry status", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "type-x-cli-doctor-home-"));
  const xHome = join(homeDir, ".x");
  const { packagePath } = await createJavaScriptFixturePackage();

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

const createJavaScriptFixturePackage = async ({
  packageName = "@test/hello-tools",
  commandName = "hello-dev",
  version = "0.0.0",
  description = "Example local development command",
  greeting = "hello from local package",
  runtime,
} = {}) => {
  const packagePath = await mkdtemp(join(tmpdir(), "type-x-fixture-js-"));

  await mkdir(join(packagePath, "dist"), { recursive: true });
  await writeFile(
    join(packagePath, "package.json"),
    JSON.stringify(
      {
        name: packageName,
        version,
        type: "module",
        x: {
          runtime: "1",
          commands: {
            [commandName]: {
              entry: "./dist/hello.js",
              description,
              ...(runtime !== undefined ? { runtime } : {}),
            },
          },
        },
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    join(packagePath, "dist/hello.js"),
    createFixtureCommandModule({
      greeting,
      includeStoredName: false,
    }),
  );

  return {
    packagePath,
    packageName,
    commandName,
  };
};

const createTypeScriptFixturePackage = async ({
  packageName = "@test/hello-tools-ts",
  commandName = "hello-ts",
  version = "0.0.0",
  description = "Example typed command",
  greeting = "hello from typed package",
} = {}) => {
  const packagePath = await mkdtemp(join(tmpdir(), "type-x-fixture-ts-"));

  await mkdir(join(packagePath, "src"), { recursive: true });
  await mkdir(join(packagePath, "dist"), { recursive: true });
  await writeFile(
    join(packagePath, "package.json"),
    JSON.stringify(
      {
        name: packageName,
        version,
        type: "module",
        scripts: {
          build: "tsc -p tsconfig.json",
        },
        devDependencies: {
          "@type-x/types": "latest",
          "@types/node": "^18.19.0",
          typescript: "^5.9.2",
        },
        x: {
          runtime: "1",
          commands: {
            [commandName]: {
              entry: "./dist/hello.js",
              description,
            },
          },
        },
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    join(packagePath, "tsconfig.json"),
    JSON.stringify(
      {
        $schema: "https://json.schemastore.org/tsconfig",
        compilerOptions: {
          lib: ["es2022"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          target: "ES2022",
          outDir: "dist",
          rootDir: ".",
          types: ["node"],
        },
        include: ["src/**/*.ts"],
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    join(packagePath, "src/hello.ts"),
    [
      'import type { CommandContext } from "@type-x/types";',
      "",
      "type Store = {",
      "  runs: number;",
      "  name?: string;",
      "};",
      "",
      "export default async function main(",
      "  context: CommandContext<Store>,",
      "): Promise<void> {",
      '  const previousRuns = (await context.store.get("runs")) ?? 0;',
      "  const runs = previousRuns + 1;",
      "",
      '  await context.store.set("runs", runs);',
      "",
      '  context.log.info("hello from typed package");',
      "  context.log.info(`command: ${context.command.name}`);",
      "}",
      "",
    ].join("\n"),
  );
  await writeFile(
    join(packagePath, "dist/hello.js"),
    createFixtureCommandModule({
      greeting,
      includeStoredName: true,
    }),
  );

  return {
    packagePath,
    packageName,
    commandName,
  };
};

const createFixtureCommandModule = ({ greeting, includeStoredName }) => {
  return [
    "const getName = (value) => {",
    '  return typeof value === "string" ? value : undefined;',
    "};",
    "",
    "export default async function main(context) {",
    '  const previousRuns = (await context.store.get("runs")) ?? 0;',
    "  const runs = Number(previousRuns) + 1;",
    "  const name = getName(context.request.flags.name);",
    "",
    '  await context.store.set("runs", runs);',
    "",
    "  if (name) {",
    '    await context.store.set("name", name);',
    "  }",
    "",
    "  const storedState = await context.store.all();",
    "",
    `  context.log.info(${JSON.stringify(greeting)});`,
    "  context.log.info(`command: ${context.command.name}`);",
    "  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);",
    "  context.log.info(`runs: ${runs}`);",
    "",
    "  if (name) {",
    "    context.log.info(`name: ${name}`);",
    "  }",
    "",
    includeStoredName
      ? '  context.log.info(`storedName: ${storedState.name ?? "none"}`);'
      : "  void storedState;",
    "}",
    "",
  ].join("\n");
};

const getStoreFileName = (packageName) => {
  return `${packageName.replaceAll("/", "__")}.json`;
};

const escapeRegExp = (value) => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
