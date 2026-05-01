import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const RELEASE_PACKAGE_PATHS = [
  "cli/package.json",
  "packages/runtime/package.json",
  "packages/types/package.json",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bumpType = args.find((a) => a !== "--dry-run");

if (bumpType !== "major" && bumpType !== "minor" && bumpType !== "patch") {
  throw new Error("Usage: node scripts/release.mjs <major|minor|patch> [--dry-run]");
}

const workspaceRoot = process.cwd();
const packageEntries = await Promise.all(
  RELEASE_PACKAGE_PATHS.map(async (relativePath) => {
    const absolutePath = resolve(workspaceRoot, relativePath);
    const content = await readFile(absolutePath, "utf8");
    const packageJson = JSON.parse(content);

    if (
      typeof packageJson.name !== "string" ||
      typeof packageJson.version !== "string"
    ) {
      throw new Error(`Invalid package manifest: ${relativePath}`);
    }

    return {
      relativePath,
      absolutePath,
      packageJson,
    };
  }),
);

const versions = new Set(
  packageEntries.map(({ packageJson }) => packageJson.version),
);

if (versions.size !== 1) {
  throw new Error(
    `Expected all published packages to share one version, found: ${Array.from(versions).join(", ")}`,
  );
}

const currentVersion = packageEntries[0].packageJson.version;
const nextVersion = bumpVersion(currentVersion, bumpType);

if (dryRun) {
  console.log(`Would bump from ${currentVersion} to ${nextVersion}`);
  console.log("\nDry run complete. No files were modified.");
  process.exit(0);
}

for (const entry of packageEntries) {
  entry.packageJson.version = nextVersion;
  await writeFile(
    entry.absolutePath,
    `${JSON.stringify(entry.packageJson, null, 2)}\n`,
    "utf8",
  );
}

console.log(`Bumped published packages from ${currentVersion} to ${nextVersion}`);

function bumpVersion(version, type) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (type === "major") {
    return `${major + 1}.0.0`;
  }

  if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}
