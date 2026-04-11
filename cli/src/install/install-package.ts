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
}: {
  rawSpecifier: string;
  cwd: string;
  mode: "add" | "upgrade";
}) => {
  const spec = parsePackageSpec(rawSpecifier, cwd);
  const packedPackage = await packPackage(spec);
  const extractedPackage = await extractPackage(
    packedPackage.tarballFile,
    packedPackage.tempDir,
  );
  const manifest = await readPackageManifest(extractedPackage.extractedDir);

  if (mode === "add") {
    await registerPackageInstall(manifest);
  } else {
    await replacePackageInstall(manifest);
  }

  return manifest;
};
