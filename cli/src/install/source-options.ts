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
  return {
    registryUrl: readStringFlag(request.flags.registry),
    scope: readStringFlag(request.flags.scope),
    token: readStringFlag(request.flags.token),
    tokenEnvName: readStringFlag(request.flags["token-env"]),
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
  return {
    kind,
    specifier,
    registryUrl: explicitOptions.registryUrl ?? storedSource?.registryUrl,
    scope: explicitOptions.scope ?? storedSource?.scope,
    tokenEnvName: explicitOptions.tokenEnvName ?? storedSource?.tokenEnvName,
  };
};

const readStringFlag = (
  value: string | boolean | undefined,
): string | undefined => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
};
