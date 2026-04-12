import { access, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import type { CommandHandler } from "@type-x/types";
import {
  createInitTemplate,
  type InitTemplateKind,
} from "./templates.js";

export const init: CommandHandler = async ({ request, ui, log }) => {
  const [maybePath] = request.args;
  const targetPath = resolve(request.pwd, maybePath ?? ".");
  const templateKind = request.flags.standalone ? "standalone" : "x";
  const defaultPackageName = getDefaultPackageName(targetPath);
  const packageName = await resolveInputValue({
    ui,
    providedValue: readStringFlag(request.flags["package-name"]),
    message: "Package name",
    defaultValue: defaultPackageName,
  });
  const defaultCommandName = getDefaultCommandName(packageName, targetPath);
  const commandName = await resolveInputValue({
    ui,
    providedValue: readStringFlag(request.flags["command-name"]),
    message: "Command name",
    defaultValue: defaultCommandName,
  });
  const template = createInitTemplate({
    kind: templateKind,
    packageName,
    commandName,
  });

  await assertTemplateFilesDoNotExist(targetPath, template.files);

  const task = ui.task(`Scaffolding ${template.label}`);

  await writeTemplateFiles(targetPath, template.files);

  task.done(`Initialized ${template.label} in ${targetPath}.`);

  log.info("");
  log.info("Next steps");

  if (targetPath !== request.pwd) {
    log.info(`  cd ${maybePath ?? targetPath}`);
  }

  for (const step of template.nextSteps) {
    log.info(`  ${step}`);
  }
};

const resolveInputValue = async ({
  ui,
  providedValue,
  message,
  defaultValue,
}: {
  ui: {
    input(message: string): Promise<string>;
  };
  providedValue: string | undefined;
  message: string;
  defaultValue: string;
}): Promise<string> => {
  if (providedValue) {
    return providedValue;
  }

  try {
    const promptedValue = await ui.input(`${message} (${defaultValue})`);
    return normalizeInputValue(promptedValue) ?? defaultValue;
  } catch (error: unknown) {
    if (isNonInteractiveUiError(error)) {
      return defaultValue;
    }

    throw error;
  }
};

const writeTemplateFiles = async (
  targetPath: string,
  files: Array<readonly [string, string]>,
): Promise<void> => {
  for (const [relativePath, content] of files) {
    const outputPath = join(targetPath, relativePath);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, {
      encoding: "utf8",
      flag: "wx",
    });
  }
};

const assertTemplateFilesDoNotExist = async (
  targetPath: string,
  files: Array<readonly [string, string]>,
): Promise<void> => {
  for (const [relativePath] of files) {
    const outputPath = join(targetPath, relativePath);

    try {
      await access(outputPath);
      throw new Error(
        `Cannot initialize project because "${outputPath}" already exists.`,
      );
    } catch (error: unknown) {
      if (!isMissingFileError(error)) {
        throw error;
      }
    }
  }
};

const readStringFlag = (
  value: string | boolean | undefined,
): string | undefined => {
  return typeof value === "string" ? normalizeInputValue(value) : undefined;
};

const getDefaultPackageName = (targetPath: string): string => {
  const folderName = basename(targetPath);

  return toKebabCase(folderName) ?? "my-command";
};

const getDefaultCommandName = (
  packageName: string,
  targetPath: string,
): string => {
  const defaultName = stripPackageScope(packageName);
  return toKebabCase(defaultName) ?? getDefaultPackageName(targetPath);
};

const normalizeInputValue = (value: string): string | undefined => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const toKebabCase = (value: string): string | undefined => {
  const kebabValue = value
    .replace(/^@/, "")
    .replaceAll("/", "-")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();

  return kebabValue.length > 0 ? kebabValue : undefined;
};

const stripPackageScope = (value: string): string => {
  const slashIndex = value.lastIndexOf("/");
  return slashIndex >= 0 ? value.slice(slashIndex + 1) : value;
};

const isNonInteractiveUiError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    error.message === "Interactive UI is not available in non-interactive mode."
  );
};

const isMissingFileError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};

export type { InitTemplateKind };
