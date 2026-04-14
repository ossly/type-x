import type { CommandHandler } from "@type-x/types";
import { readCliPackageVersion } from "../runtime/cli-package.js";

export const version: CommandHandler = async () => {
  console.log(await readCliPackageVersion());
};
