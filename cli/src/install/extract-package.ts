import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ExtractedPackage {
  extractedDir: string;
}

export const extractPackage = async (
  tarballFile: string,
  tempDir: string,
): Promise<ExtractedPackage> => {
  const extractDir = resolve(tempDir, "extract");

  await mkdir(extractDir, { recursive: true });

  try {
    await execFileAsync("tar", ["-xzf", tarballFile, "-C", extractDir]);
  } catch (error: unknown) {
    throw new Error(
      `Failed to extract package tarball "${tarballFile}": ${getErrorMessage(error)}`,
    );
  }

  return {
    extractedDir: join(extractDir, "package"),
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
