import { rm } from "node:fs/promises";

import { extractPackage } from "./extract-package.js";
import { packPackage } from "./pack-package.js";
import { parsePackageSpec } from "./package-spec.js";
import {
  registerPackageInstall,
  replacePackageInstall,
} from "./register-package.js";
import { readPackageManifest } from "../runtime/manifest.js";

export const installPackage = async ({
  rawSpecifier,
  cwd,
  mode,
  onStatus,
}: {
  rawSpecifier: string;
  cwd: string;
  mode: "add" | "upgrade";
  onStatus?: (message: string) => void;
}) => {
  onStatus?.("Resolving package spec");
  const spec = parsePackageSpec(rawSpecifier, cwd);

  onStatus?.("Packing package");
  const packedPackage = await packPackage(spec);
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
      await registerPackageInstall(manifest);
    } else {
      onStatus?.("Replacing installed package");
      await replacePackageInstall(manifest);
    }

    return manifest;
  } finally {
    await rm(packedPackage.tempDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
  }
};
