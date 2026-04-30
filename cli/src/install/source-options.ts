import type { CommandRequest } from "@type-x/types";

import type { RegistryPackageSource } from "../runtime/registry.js";

export interface InstallSourceOptions {
  registryUrl?: string;
  scope?: string;
  token?: string;
  tokenEnvName?: string;
}

export const readInstallSourceOptions = (
  request: CommandRequest,
): InstallSourceOptions => {
  const registryUrl = readStringFlag(request.flags.registry);
  const scope = readStringFlag(request.flags.scope);
  const token = readStringFlag(request.flags.token);
  const tokenEnvName = readStringFlag(request.flags["token-env"]);

  return {
    ...(registryUrl !== undefined ? { registryUrl } : {}),
    ...(scope !== undefined ? { scope } : {}),
    ...(token !== undefined ? { token } : {}),
    ...(tokenEnvName !== undefined ? { tokenEnvName } : {}),
  };
};

export const mergeInstallSource = ({
  specifier,
  kind,
  explicitOptions,
  storedSource,
}: {
  specifier: string;
  kind: RegistryPackageSource["kind"];
  explicitOptions: InstallSourceOptions;
  storedSource?: RegistryPackageSource;
}): RegistryPackageSource => {
  const inferredScope = inferScopeFromSpecifier(specifier);
  const registryUrl = explicitOptions.registryUrl ?? storedSource?.registryUrl;
  const scope = explicitOptions.scope ?? storedSource?.scope ?? inferredScope;
  const tokenEnvName =
    explicitOptions.tokenEnvName ?? storedSource?.tokenEnvName;

  return {
    kind,
    specifier,
    ...(registryUrl !== undefined ? { registryUrl } : {}),
    ...(scope !== undefined ? { scope } : {}),
    ...(tokenEnvName !== undefined ? { tokenEnvName } : {}),
  };
};

const readStringFlag = (
  value: string | boolean | undefined,
): string | undefined => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
};

const inferScopeFromSpecifier = (specifier: string): string | undefined => {
  if (!specifier.startsWith("@")) {
    return undefined;
  }

  const slashIndex = specifier.indexOf("/");

  if (slashIndex <= 1) {
    return undefined;
  }

  return specifier.slice(0, slashIndex);
};
