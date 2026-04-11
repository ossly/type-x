import { ensureRuntimeDirs } from '../runtime/paths.js';
import { readRegistry, writeRegistry } from '../runtime/registry.js';

export const doctor = async (): Promise<void> => {
  const paths = await ensureRuntimeDirs();
  const registry = await readRegistry();

  await writeRegistry(registry);

  console.log(`homeDir: ${paths.homeDir}`);

  console.log(`registryFile: ${paths.registryFile}`);

  console.log(`packagesDir: ${paths.packagesDir}`);
  console.log(`storesDir: ${paths.storesDir}`);
  console.log(`binDir: ${paths.binDir}`);
  console.log(`tmpDir: ${paths.tmpDir}`);

  console.log(`packages: ${Object.keys(registry.packages).length}`);
  console.log(`commands: ${Object.keys(registry.commands).length}`);
  console.log(`aliases: ${Object.keys(registry.aliases).length}`);
};
