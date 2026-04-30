import { rm } from "node:fs/promises";

import { extractPackage } from "./extract-package.js";
import { packPackage } from "./pack-package.js";
import { parsePackageSpec } from "./package-spec.js";
import {
  mergeInstallSource,
  type InstallSourceOptions,
} from "./source-options.js";
import {
  registerPackageInstall,
  replacePackageInstall,
} from "./register-package.js";
import { readPackageManifest } from "../runtime/manifest.js";
import { readRegistry } from "../runtime/registry.js";

export const installPackage = async ({
  rawSpecifier,
  cwd,
  mode,
  options,
  onStatus,
}: {
  rawSpecifier: string;
  cwd: string;
  mode: "add" | "upgrade";
  options?: InstallSourceOptions;
  onStatus?: (message: string) => void;
}) => {
  onStatus?.("Resolving package spec");
  const registry = mode === "upgrade" ? await readRegistry() : undefined;
  const existingPackage =
    registry && isInstalledPackageName(rawSpecifier, registry.packages)
      ? registry.packages[rawSpecifier]
      : undefined;
  const specifier = existingPackage?.source?.specifier ?? rawSpecifier;
  const spec = parsePackageSpec(specifier, cwd);
  const source = mergeInstallSource({
    specifier: spec.source,
    kind: spec.kind,
    explicitOptions: options ?? {},
    storedSource: existingPackage?.source,
  });

  onStatus?.("Packing package");
  const packedPackage = await packPackage(spec, {
    registryUrl: source.registryUrl,
    scope: source.scope,
    token: options?.token,
    tokenEnvName: source.tokenEnvName,
  });
  try {
    onStatus?.("Extracting package");
    const extractedPackage = await extractPackage(
      packedPackage.tarballFile,
      packedPackage.tempDir,
    );

    onStatus?.("Validating package manifest");
    const manifest = await readPackageManifest(extractedPackage.extractedDir);

    if (mode === "add") {
      onStatus?.("Registering package");
      await registerPackageInstall(manifest, source);
    } else {
      onStatus?.("Replacing installed package");
      await replacePackageInstall(manifest, source);
    }

    return manifest;
  } finally {
    await rm(packedPackage.tempDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
  }
};

const isInstalledPackageName = (
  value: string,
  packages: Record<string, unknown>,
): boolean => {
  return Object.hasOwn(packages, value);
};
