import type { CommandHandler } from "../runtime/context.js";
import { parsePackageSpec } from "../install/package-spec.js";
import { packPackage } from "../install/pack-package.js";
import { extractPackage } from "../install/extract-package.js";
import { registerPackageInstall } from "../install/register-package.js";
import { readPackageManifest } from "../runtime/manifest.js";

export const add: CommandHandler = async ({ request }) => {
  const [, rawSpecifier] = request.argv;

  if (!rawSpecifier) {
    throw new Error("Usage: x add <package-name-or-path>");
  }

  const spec = parsePackageSpec(rawSpecifier, request.pwd);
  const packedPackage = await packPackage(spec);
  const extractedPackage = await extractPackage(
    packedPackage.tarballFile,
    packedPackage.tempDir,
  );
  const manifest = await readPackageManifest(extractedPackage.extractedDir);

  await registerPackageInstall(manifest);

  console.log(
    `Installed ${manifest.packageName}@${manifest.packageVersion} with ${Object.keys(manifest.commands).length} command(s).`,
  );
};
