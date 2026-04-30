import { readFile, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { homedir } from "node:os";

import { getDefaultRuntimeHomeDir, getRuntimePaths } from "../runtime/paths.js";

export interface ShellSetupSuggestion {
  shellName: string;
  rcFile: string | null;
  exportLine: string;
  binDir: string;
  pathConfigured: boolean;
}

export const getShellSetupSuggestion = (): ShellSetupSuggestion => {
  const { binDir } = getRuntimePaths();
  const shellPath = process.env.SHELL ?? "";
  const shellName = shellPath.split("/").filter(Boolean).at(-1) ?? "sh";
  const rcFile = getRcFile(shellName);
  const exportLine = getPathExportLine(binDir);

  return {
    shellName,
    rcFile,
    exportLine,
    binDir,
    pathConfigured: isBinDirInPath(binDir),
  };
};

export const ensureShellPathSetup = async (): Promise<ShellSetupSuggestion> => {
  const suggestion = getShellSetupSuggestion();

  if (!suggestion.rcFile) {
    throw new Error(
      `Shell "${suggestion.shellName}" is not supported for automatic setup.`,
    );
  }

  let currentContent = "";

  try {
    currentContent = await readFile(suggestion.rcFile, "utf8");
  } catch (error: unknown) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  if (!currentContent.includes(suggestion.exportLine)) {
    const prefix =
      currentContent.length > 0 && !currentContent.endsWith("\n") ? "\n" : "";

    await writeFile(
      suggestion.rcFile,
      `${currentContent}${prefix}${suggestion.exportLine}\n`,
      "utf8",
    );
  }

  return {
    ...suggestion,
    pathConfigured: true,
  };
};

export const getShellSetupMessage = (): string[] => {
  const suggestion = getShellSetupSuggestion();

  if (suggestion.pathConfigured) {
    return [];
  }

  if (suggestion.rcFile) {
    return [
      `Aliases were created, but ${suggestion.binDir} is not in PATH.`,
      `Run "x setup-shell" to add it to ${suggestion.rcFile}.`,
      `Or add this line manually: ${suggestion.exportLine}`,
    ];
  }

  return [
    `Aliases were created, but ${suggestion.binDir} is not in PATH.`,
    `Add this line to your shell config manually: ${suggestion.exportLine}`,
  ];
};

const isBinDirInPath = (binDir: string): boolean => {
  const pathValue = process.env.PATH;

  if (!pathValue) {
    return false;
  }

  return pathValue.split(delimiter).includes(binDir);
};

const getRcFile = (shellName: string): string | null => {
  const homeDir = homedir();

  switch (shellName) {
    case "zsh":
      return join(homeDir, ".zshrc");
    case "bash":
      return join(homeDir, ".bashrc");
    default:
      return null;
  }
};

const getPathExportLine = (binDir: string): string => {
  const defaultBinDir = join(getDefaultRuntimeHomeDir(), "bin");
  const defaultHomeBinDir = join(homedir(), ".type-x", "type-x__cli", "bin");

  if (binDir === defaultBinDir && binDir === defaultHomeBinDir) {
    return 'export PATH="$HOME/.type-x/type-x__cli/bin:$PATH"';
  }

  return `export PATH=${quoteShellValue(binDir)}:$PATH`;
};

const quoteShellValue = (value: string): string => {
  return `'${value.replaceAll("'", `'\\''`)}'`;
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};
