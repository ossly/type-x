import type {
  CommandIo,
  CommandIoDownloadOptions,
  CommandIoDownloadResult,
} from "@type-x/types";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";

export const createCommandIo = ({ cwd }: { cwd: string }): CommandIo => {
  return {
    expandPath: (path: string): string => {
      return expandPath(path, cwd);
    },
    download: async (
      url: string,
      options: CommandIoDownloadOptions = {},
    ): Promise<CommandIoDownloadResult> => {
      const parsedUrl = parseDownloadUrl(url);
      const inferredFileName = inferFileName(parsedUrl);
      const targetFileName = options.fileName ?? inferredFileName;
      const targetPath = await resolveDownloadPath({
        cwd,
        destination: options.destination,
        fileName: targetFileName,
        hasExplicitFileName: options.fileName !== undefined,
      });

      if (!options.overwrite && (await pathExists(targetPath))) {
        throw new Error(`Download destination already exists: ${targetPath}`);
      }

      const response = await fetch(parsedUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download "${parsedUrl}": HTTP ${response.status} ${response.statusText}`.trim(),
        );
      }

      const bytes = Buffer.from(await response.arrayBuffer());

      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, bytes);

      return {
        path: targetPath,
        fileName: basename(targetPath),
      };
    },
  };
};

export const expandPath = (path: string, cwd: string): string => {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith(`~${sep}`) || path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }

  return resolve(cwd, path);
};

const parseDownloadUrl = (url: string): URL => {
  try {
    return new URL(url);
  } catch (error: unknown) {
    throw new Error(
      `Invalid download URL "${url}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const inferFileName = (url: URL): string => {
  const pathname = url.pathname;
  const name = pathname.split("/").filter(Boolean).at(-1);

  return name && name.length > 0 ? name : "download";
};

const resolveDownloadPath = async ({
  cwd,
  destination,
  fileName,
  hasExplicitFileName,
}: {
  cwd: string;
  destination: string | undefined;
  fileName: string;
  hasExplicitFileName: boolean;
}): Promise<string> => {
  if (!destination) {
    return join(cwd, fileName);
  }

  const resolvedDestination = expandPath(destination, cwd);

  if (hasExplicitFileName) {
    return join(resolvedDestination, fileName);
  }

  if (await isDirectoryPath(resolvedDestination, destination)) {
    return join(resolvedDestination, fileName);
  }

  return resolvedDestination;
};

const isDirectoryPath = async (
  resolvedDestination: string,
  rawDestination: string,
): Promise<boolean> => {
  if (
    rawDestination.endsWith("/") ||
    rawDestination.endsWith("\\") ||
    resolvedDestination.endsWith(sep)
  ) {
    return true;
  }

  try {
    const destinationStats = await stat(resolvedDestination);
    return destinationStats.isDirectory();
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return false;
    }

    throw error;
  }
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return false;
    }

    throw error;
  }
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
