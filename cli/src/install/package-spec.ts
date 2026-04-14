import { isAbsolute, resolve } from "node:path";

export interface PackageSpec {
  raw: string;
  source: string;
  kind: "npm" | "local";
}

export const parsePackageSpec = (raw: string, cwd: string): PackageSpec => {
  const isLocalPath =
    raw.startsWith(".") || raw.startsWith("/") || raw.startsWith("..");

  return {
    raw,
    source: isLocalPath && !isAbsolute(raw) ? resolve(cwd, raw) : raw,
    kind: isLocalPath ? "local" : "npm",
  };
};
