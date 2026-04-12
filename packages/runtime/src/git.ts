import type { CommandExec, CommandGit, CommandGitInfo } from "@type-x/types";
import { basename } from "node:path";

export const createCommandGit = (exec: CommandExec): CommandGit => {
  let infoPromise: Promise<CommandGitInfo> | undefined;

  return {
    getInfo: async (): Promise<CommandGitInfo> => {
      infoPromise ??= readGitInfo(exec);
      return infoPromise;
    },
  };
};

const readGitInfo = async (exec: CommandExec): Promise<CommandGitInfo> => {
  const insideWorkTree = await runGit(exec, [
    "rev-parse",
    "--is-inside-work-tree",
  ]);

  if (!insideWorkTree.ok || insideWorkTree.stdout.trim() !== "true") {
    return {
      isRepository: false,
    };
  }

  const rootDirResult = await runGit(exec, ["rev-parse", "--show-toplevel"]);
  const branchResult = await runGit(exec, ["branch", "--show-current"]);
  const originUrlResult = await runGit(exec, ["remote", "get-url", "origin"]);

  const rootDir = getTrimmedOutput(rootDirResult);
  const branch = getTrimmedOutput(branchResult);
  const originUrl = getTrimmedOutput(originUrlResult);
  const repoName = getRepoName(originUrl, rootDir);

  return {
    isRepository: true,
    rootDir,
    branch,
    originUrl,
    repoName,
    isDetachedHead: branch === undefined,
  };
};

const runGit = async (
  exec: CommandExec,
  args: string[],
): Promise<
  | {
      ok: true;
      stdout: string;
      stderr: string;
    }
  | {
      ok: false;
      stdout: string;
      stderr: string;
    }
> => {
  try {
    const result = await exec("git", args, {
      rejectOnNonZero: false,
    });

    if (result.exitCode !== 0) {
      return {
        ok: false,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }

    return {
      ok: true,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: unknown) {
    if (isMissingCommandError(error)) {
      return {
        ok: false,
        stdout: "",
        stderr: "",
      };
    }

    return {
      ok: false,
      stdout: "",
      stderr: getErrorMessage(error),
    };
  }
};

const getTrimmedOutput = (
  result:
    | {
        ok: true;
        stdout: string;
      }
    | {
        ok: false;
        stdout: string;
      },
): string | undefined => {
  const value = result.stdout.trim();
  return value.length > 0 ? value : undefined;
};

const getRepoName = (
  originUrl: string | undefined,
  rootDir: string | undefined,
): string | undefined => {
  const originRepoName = originUrl ? parseRepoNameFromOrigin(originUrl) : undefined;

  if (originRepoName) {
    return originRepoName;
  }

  if (!rootDir) {
    return undefined;
  }

  return basename(rootDir);
};

const parseRepoNameFromOrigin = (originUrl: string): string | undefined => {
  const normalized = originUrl.endsWith(".git")
    ? originUrl.slice(0, -4)
    : originUrl;

  const segments = normalized.split(/[/:]/).filter(Boolean);
  const repoName = segments.at(-1);

  return repoName && repoName.length > 0 ? repoName : undefined;
};

const isMissingCommandError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};
