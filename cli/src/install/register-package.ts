import { cp, rm } from "node:fs/promises";
import { join } from "node:path";

import type { PackageManifest } from "../runtime/manifest.js";
import { INTERNAL_COMMAND_NAME_SET } from "../runtime/internal-command-names.js";
import {
  readRegistry,
  writeRegistry,
  type Registry,
  type RegistryCommand,
  type RegistryPackage,
} from "../runtime/registry.js";
import { ensureRuntimeDirs } from "../runtime/paths.js";

export const registerPackageInstall = async (
  manifest: PackageManifest,
): Promise<void> => {
  const paths = await ensureRuntimeDirs();
  const registry = await readRegistry();

  assertPackageCanBeInstalled(registry, manifest);

  const packageDir = join(
    paths.packagesDir,
    sanitizePackageName(manifest.packageName),
    manifest.packageVersion,
  );

  await cp(manifest.packagePath, packageDir, {
    recursive: true,
    errorOnExist: true,
  });

  const registryPackage: RegistryPackage = {
    name: manifest.packageName,
    version: manifest.packageVersion,
    path: packageDir,
    commands: Object.keys(manifest.commands),
  };

  const nextRegistry: Registry = {
    ...registry,
    packages: {
      ...registry.packages,
      [manifest.packageName]: registryPackage,
    },
    commands: {
      ...registry.commands,
    },
    aliases: {
      ...registry.aliases,
    },
  };

  for (const [commandName, command] of Object.entries(manifest.commands)) {
    const registryCommand: RegistryCommand = {
      packageName: manifest.packageName,
      packageVersion: manifest.packageVersion,
      entry: command.entry,
      description: command.description,
    };

    nextRegistry.commands[commandName] = registryCommand;
  }

  try {
    await writeRegistry(nextRegistry);
  } catch (error: unknown) {
    await rm(packageDir, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
};

export const replacePackageInstall = async (
  manifest: PackageManifest,
): Promise<void> => {
  const paths = await ensureRuntimeDirs();
  const registry = await readRegistry();
  const existingPackage = registry.packages[manifest.packageName];

  if (!existingPackage) {
    throw new Error(
      `Package "${manifest.packageName}" is not installed, so it cannot be upgraded.`,
    );
  }

  assertPackageCanReplace(registry, manifest);

  const packageDir = join(
    paths.packagesDir,
    sanitizePackageName(manifest.packageName),
    manifest.packageVersion,
  );

  await cp(manifest.packagePath, packageDir, {
    recursive: true,
    errorOnExist: true,
  });

  const nextRegistry: Registry = {
    ...registry,
    packages: {
      ...registry.packages,
    },
    commands: {
      ...registry.commands,
    },
    aliases: {
      ...registry.aliases,
    },
  };

  for (const commandName of existingPackage.commands) {
    delete nextRegistry.commands[commandName];
  }

  nextRegistry.packages[manifest.packageName] = {
    name: manifest.packageName,
    version: manifest.packageVersion,
    path: packageDir,
    commands: Object.keys(manifest.commands),
  };

  for (const [commandName, command] of Object.entries(manifest.commands)) {
    nextRegistry.commands[commandName] = {
      packageName: manifest.packageName,
      packageVersion: manifest.packageVersion,
      entry: command.entry,
      description: command.description,
    };
  }

  try {
    await writeRegistry(nextRegistry);
  } catch (error: unknown) {
    await rm(packageDir, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }

  await rm(existingPackage.path, { recursive: true, force: true }).catch(
    () => undefined,
  );
};

const assertPackageCanBeInstalled = (
  registry: Registry,
  manifest: PackageManifest,
): void => {
  const existingPackage = registry.packages[manifest.packageName];

  if (existingPackage) {
    throw new Error(
      `Package "${manifest.packageName}" is already installed at version "${existingPackage.version}".`,
    );
  }

  for (const commandName of Object.keys(manifest.commands)) {
    if (INTERNAL_COMMAND_NAME_SET.has(commandName)) {
      throw new Error(
        `Command "${commandName}" conflicts with an internal x command.`,
      );
    }

    if (registry.commands[commandName]) {
      throw new Error(
        `Command "${commandName}" is already registered by package "${registry.commands[commandName].packageName}".`,
      );
    }

    if (registry.aliases[commandName]) {
      throw new Error(
        `Command "${commandName}" conflicts with an existing alias.`,
      );
    }
  }
};

const assertPackageCanReplace = (
  registry: Registry,
  manifest: PackageManifest,
): void => {
  const existingPackage = registry.packages[manifest.packageName];

  if (!existingPackage) {
    throw new Error(
      `Package "${manifest.packageName}" is not installed, so it cannot be upgraded.`,
    );
  }

  if (existingPackage.version === manifest.packageVersion) {
    throw new Error(
      `Package "${manifest.packageName}" is already installed at version "${manifest.packageVersion}".`,
    );
  }

  for (const commandName of Object.keys(manifest.commands)) {
    if (INTERNAL_COMMAND_NAME_SET.has(commandName)) {
      throw new Error(
        `Command "${commandName}" conflicts with an internal x command.`,
      );
    }

    const existingCommand = registry.commands[commandName];

    if (
      existingCommand &&
      existingCommand.packageName !== manifest.packageName
    ) {
      throw new Error(
        `Command "${commandName}" is already registered by package "${existingCommand.packageName}".`,
      );
    }

    if (registry.aliases[commandName]) {
      throw new Error(
        `Command "${commandName}" conflicts with an existing alias.`,
      );
    }
  }
};

const sanitizePackageName = (packageName: string): string => {
  return packageName.replaceAll("/", "__");
};
