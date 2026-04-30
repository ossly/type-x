import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

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

console.log(`Bumping from ${currentVersion} to ${nextVersion}${dryRun ? " (dry run)" : ""}`);

// Generate changelog entry from git log since the last tag.
const changelog = await buildChangelogEntry(nextVersion, currentVersion);

if (dryRun) {
  console.log("\n--- Changelog entry ---");
  console.log(changelog);
  console.log("--- End changelog ---");
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

await prependChangelog(changelog);

console.log(`Bumped published packages from ${currentVersion} to ${nextVersion}`);
console.log("Updated CHANGELOG.md");

// --- helpers ---

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

async function buildChangelogEntry(nextVersion, currentVersion) {
  const date = new Date().toISOString().slice(0, 10);

  let commits = "";
  try {
    // Get all commits since the last tag (or all commits if no tag exists).
    const lastTag = await getLastTag(currentVersion);
    const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
    const { stdout } = await execFileAsync("git", [
      "log",
      range,
      "--pretty=format:- %s",
      "--no-merges",
    ]);
    commits = stdout.trim();
  } catch {
    commits = "- (could not read git log)";
  }

  return [
    `## [${nextVersion}] - ${date}`,
    "",
    commits || "- (no commits since last release)",
    "",
  ].join("\n");
}

async function getLastTag(currentVersion) {
  try {
    const { stdout } = await execFileAsync("git", [
      "tag",
      "--list",
      `v${currentVersion}`,
    ]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function prependChangelog(entry) {
  const changelogPath = resolve(workspaceRoot, "CHANGELOG.md");
  let existing = "";

  try {
    existing = await readFile(changelogPath, "utf8");
  } catch {
    existing = "# Changelog\n\n";
  }

  // Insert after the first heading line (# Changelog\n\n).
  const insertAt = existing.indexOf("\n\n") + 2;
  const updated =
    existing.slice(0, insertAt) + entry + "\n" + existing.slice(insertAt);

  await writeFile(changelogPath, updated, "utf8");
}
