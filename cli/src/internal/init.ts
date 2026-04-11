import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import type { CommandHandler } from "@type-x/types";

export const init: CommandHandler = async ({ request }) => {
  const [, maybePath] = request.argv;
  const useTypeScript = Boolean(request.flags.ts);
  const targetPath = resolve(request.pwd, maybePath ?? ".");
  const packageName = getPackageName(targetPath);
  const commandName = getCommandName(targetPath);

  await mkdir(join(targetPath, "src"), { recursive: true });

  const files = useTypeScript
    ? createTypeScriptTemplate(packageName, commandName)
    : createJavaScriptTemplate(packageName, commandName);

  await Promise.all(
    files.map(async ([relativePath, content]) => {
      await writeFile(join(targetPath, relativePath), content, {
        encoding: "utf8",
        flag: "wx",
      });
    }),
  );

  console.log(
    `Initialized ${useTypeScript ? "TypeScript" : "JavaScript"} x package in ${targetPath}.`,
  );
  console.log("");
  console.log("Next steps");
  console.log(`  cd ${targetPath}`);

  if (useTypeScript) {
    console.log("  pnpm install");
    console.log("  pnpm build");
  }

  console.log(`  x run . ${commandName}`);
};

const createJavaScriptTemplate = (
  packageName: string,
  commandName: string,
): Array<readonly [string, string]> => {
  return [
    [
      "package.json",
      JSON.stringify(
        {
          name: packageName,
          version: "0.0.0",
          type: "module",
          x: {
            runtime: "1",
            commands: {
              [commandName]: {
                entry: "./src/index.js",
                description: "Example x command",
              },
            },
          },
        },
        null,
        2,
      ) + "\n",
    ],
    [
      "src/index.js",
      [
        "export default async function main(context) {",
        '  context.log.info("hello from x");',
        "  context.log.info(`command: ${context.command.name}`);",
        "}",
        "",
      ].join("\n"),
    ],
  ];
};

const createTypeScriptTemplate = (
  packageName: string,
  commandName: string,
): Array<readonly [string, string]> => {
  return [
    [
      "package.json",
      JSON.stringify(
        {
          name: packageName,
          version: "0.0.0",
          type: "module",
          scripts: {
            build: "tsc -p tsconfig.json",
            "check-types": "tsc -p tsconfig.json --noEmit",
          },
          devDependencies: {
            "@type-x/types": "latest",
            "@types/node": "^25.6.0",
            typescript: "^5.9.2",
          },
          x: {
            runtime: "1",
            commands: {
              [commandName]: {
                entry: "./dist/src/index.js",
                description: "Example x command",
              },
            },
          },
        },
        null,
        2,
      ) + "\n",
    ],
    [
      "tsconfig.json",
      JSON.stringify(
        {
          $schema: "https://json.schemastore.org/tsconfig",
          compilerOptions: {
            declaration: true,
            declarationMap: true,
            esModuleInterop: true,
            incremental: false,
            isolatedModules: true,
            lib: ["es2022"],
            module: "NodeNext",
            moduleDetection: "force",
            moduleResolution: "NodeNext",
            noUncheckedIndexedAccess: true,
            resolveJsonModule: true,
            skipLibCheck: true,
            strict: true,
            target: "ES2022",
            outDir: "dist",
            rootDir: ".",
            noEmit: false,
            types: ["node"],
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ) + "\n",
    ],
    [
      "src/index.ts",
      [
        'import type { CommandContext } from "@type-x/types";',
        "",
        "type Store = {",
        "  runs: number;",
        "};",
        "",
        "export default async function main(",
        "  context: CommandContext<Store>,",
        "): Promise<void> {",
        '  const previousRuns = (await context.store.get("runs")) ?? 0;',
        "  const runs = previousRuns + 1;",
        "",
        '  await context.store.set("runs", runs);',
        "",
        '  context.log.info("hello from x");',
        "  context.log.info(`command: ${context.command.name}`);",
        "  context.log.info(`runs: ${runs}`);",
        "}",
        "",
      ].join("\n"),
    ],
  ];
};

const getPackageName = (targetPath: string): string => {
  const folderName = basename(targetPath);

  if (folderName.length === 0) {
    return "my-x-package";
  }

  return folderName;
};

const getCommandName = (targetPath: string): string => {
  const folderName = basename(targetPath);

  if (folderName.length === 0) {
    return "hello";
  }

  return folderName;
};
