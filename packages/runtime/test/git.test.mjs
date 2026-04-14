import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

import {
  createCommandExec,
  createCommandGit,
} from "../dist/src/index.js";

test("createCommandGit returns false when git is not installed", async () => {
  const repoDir = await mkdtemp(join(tmpdir(), "type-x-git-missing-"));
  const exec = createCommandExec({
    cwd: repoDir,
    env: {
      ...process.env,
      PATH: "",
    },
  });
  const git = createCommandGit(exec);

  const info = await git.getInfo();

  assert.deepEqual(info, {
    isRepository: false,
  });
});

test("createCommandGit returns false outside a repository", async () => {
  const dir = await mkdtemp(join(tmpdir(), "type-x-git-none-"));
  const exec = createCommandExec({
    cwd: dir,
    env: process.env,
  });
  const git = createCommandGit(exec);

  const info = await git.getInfo();

  assert.deepEqual(info, {
    isRepository: false,
  });
});

test("createCommandGit returns repository details when inside a git repo", async () => {
  const repoDir = await mkdtemp(join(tmpdir(), "type-x-git-repo-"));
  const exec = createCommandExec({
    cwd: repoDir,
    env: process.env,
  });

  await exec("git init");
  await exec(
    "git remote add origin https://github.com/example/demo-repo.git",
  );

  const git = createCommandGit(exec);
  const info = await git.getInfo();
  const cachedInfo = await git.getInfo();
  const canonicalRepoDir = await realpath(repoDir);

  assert.equal(info.isRepository, true);
  assert.equal(info.rootDir, canonicalRepoDir);
  assert.equal(typeof info.branch, "string");
  assert.equal(info.originUrl, "https://github.com/example/demo-repo.git");
  assert.equal(info.repoName, "demo-repo");
  assert.equal(info.isDetachedHead, false);
  assert.deepEqual(cachedInfo, info);
});
