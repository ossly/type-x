import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ensureRuntimeDirs, getRuntimePaths } from "./paths.js";

interface UpdateCache {
  checkedAt: number;
  latestVersion: string;
}

const PACKAGE_NAME = "@type-x/cli";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 2000;

/**
 * Returns the latest available version if it is newer than currentVersion,
 * otherwise undefined. Also refreshes the cache in the background when stale
 * (at most once per CACHE_TTL_MS; the network call is awaited so it updates
 * the cache file before the process exits).
 */
export const getUpdateNotice = async (
  currentVersion: string,
): Promise<string | undefined> => {
  const cache = await readUpdateCache();
  const isStale = !cache || Date.now() - cache.checkedAt > CACHE_TTL_MS;

  const latestVersion = isStale
    ? await fetchLatestVersion()
    : cache.latestVersion;

  if (!latestVersion) return undefined;

  return isNewerVersion(latestVersion, currentVersion) ? latestVersion : undefined;
};

const readUpdateCache = async (): Promise<UpdateCache | undefined> => {
  try {
    const { homeDir } = getRuntimePaths();
    const raw = await readFile(join(homeDir, "update-check.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<UpdateCache>;

    if (
      typeof parsed.checkedAt !== "number" ||
      typeof parsed.latestVersion !== "string"
    ) {
      return undefined;
    }

    return { checkedAt: parsed.checkedAt, latestVersion: parsed.latestVersion };
  } catch {
    return undefined;
  }
};

const fetchLatestVersion = async (): Promise<string | undefined> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
      { signal: controller.signal },
    );
    clearTimeout(timer);

    const data = (await response.json()) as { version?: unknown };
    if (typeof data.version !== "string") return undefined;

    const paths = await ensureRuntimeDirs();
    const cache: UpdateCache = {
      checkedAt: Date.now(),
      latestVersion: data.version,
    };
    await writeFile(
      join(paths.homeDir, "update-check.json"),
      `${JSON.stringify(cache, null, 2)}\n`,
      "utf8",
    );

    return data.version;
  } catch {
    return undefined;
  }
};

const isNewerVersion = (latest: string, current: string): boolean => {
  const parse = (v: string): [number, number, number] => {
    const parts = v.split(".");
    return [
      parseInt(parts[0] ?? "0", 10) || 0,
      parseInt(parts[1] ?? "0", 10) || 0,
      parseInt(parts[2] ?? "0", 10) || 0,
    ];
  };

  const [lMaj, lMin, lPat] = parse(latest);
  const [cMaj, cMin, cPat] = parse(current);

  if (lMaj !== cMaj) return (lMaj ?? 0) > (cMaj ?? 0);
  if (lMin !== cMin) return (lMin ?? 0) > (cMin ?? 0);
  return (lPat ?? 0) > (cPat ?? 0);
};
