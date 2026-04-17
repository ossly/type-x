import { renderTemplate } from "./render-template.js";

export type InitTemplateKind = "x" | "standalone";

export interface InitTemplate {
  label: string;
  files: Array<readonly [string, string]>;
  nextSteps: string[];
}

export const createInitTemplate = ({
  kind,
  packageName,
  commandName,
  typexVersion,
}: {
  kind: InitTemplateKind;
  packageName: string;
  commandName: string;
  typexVersion: string;
}): InitTemplate => {
  const values = {
    PACKAGE_NAME: packageName,
    COMMAND_NAME: commandName,
    COMMAND_DESCRIPTION: `Say hello from ${commandName}`,
    TYPEX_VERSION: typexVersion,
  };

  if (kind === "standalone") {
    return {
      label: "standalone TypeScript CLI",
      files: [
        ["README.md", renderTemplate(STANDALONE_README_TEMPLATE, values)],
        [
          "package.json",
          renderTemplate(STANDALONE_PACKAGE_JSON_TEMPLATE, values),
        ],
        ["tsconfig.json", TYPESCRIPT_CONFIG_TEMPLATE],
        [".gitignore", GITIGNORE_TEMPLATE],
        ["src/index.ts", renderTemplate(STANDALONE_ENTRY_TEMPLATE, values)],
      ],
      nextSteps: ["pnpm install", "pnpm build", "node dist/src/index.js"],
    };
  }

  return {
    label: "TypeScript x package",
    files: [
      ["README.md", renderTemplate(X_PACKAGE_README_TEMPLATE, values)],
      ["package.json", renderTemplate(X_PACKAGE_JSON_TEMPLATE, values)],
      ["tsconfig.json", TYPESCRIPT_CONFIG_TEMPLATE],
      [".gitignore", GITIGNORE_TEMPLATE],
      ["src/index.ts", renderTemplate(X_PACKAGE_ENTRY_TEMPLATE, values)],
    ],
    nextSteps: ["pnpm install", "pnpm build", `x run . ${commandName}`],
  };
};

const GITIGNORE_TEMPLATE = ["node_modules", "dist", ".type-x", ""].join("\n");

const TYPESCRIPT_CONFIG_TEMPLATE = [
  "{",
  '  "$schema": "https://json.schemastore.org/tsconfig",',
  '  "compilerOptions": {',
  '    "declaration": true,',
  '    "declarationMap": true,',
  '    "esModuleInterop": true,',
  '    "incremental": false,',
  '    "isolatedModules": true,',
  '    "lib": ["es2022"],',
  '    "module": "NodeNext",',
  '    "moduleDetection": "force",',
  '    "moduleResolution": "NodeNext",',
  '    "noUncheckedIndexedAccess": true,',
  '    "resolveJsonModule": true,',
  '    "skipLibCheck": true,',
  '    "strict": true,',
  '    "target": "ES2022",',
  '    "outDir": "dist",',
  '    "rootDir": ".",',
  '    "noEmit": false,',
  '    "types": ["node"]',
  "  },",
  '  "include": ["src/**/*.ts"]',
  "}",
  "",
].join("\n");

const X_PACKAGE_JSON_TEMPLATE = [
  "{",
  '  "name": "{{PACKAGE_NAME}}",',
  '  "version": "0.0.0",',
  '  "type": "module",',
  '  "files": ["dist"],',
  '  "scripts": {',
  '    "build": "tsc -p tsconfig.json",',
  '    "check-types": "tsc -p tsconfig.json --noEmit",',
  '    "prepack": "npm run build"',
  "  },",
  '  "devDependencies": {',
  '    "@type-x/types": "{{TYPEX_VERSION}}",',
  '    "@types/node": "^25.6.0",',
  '    "typescript": "^5.9.2"',
  "  },",
  '  "x": {',
  '    "runtime": "1",',
  '    "commands": {',
  '      "{{COMMAND_NAME}}": {',
  '        "entry": "./dist/src/index.js",',
  '        "description": "{{COMMAND_DESCRIPTION}}"',
  "      }",
  "    }",
  "  }",
  "}",
  "",
].join("\n");

const STANDALONE_PACKAGE_JSON_TEMPLATE = [
  "{",
  '  "name": "{{PACKAGE_NAME}}",',
  '  "version": "0.0.0",',
  '  "type": "module",',
  '  "files": ["dist"],',
  '  "bin": {',
  '    "{{COMMAND_NAME}}": "./dist/src/index.js"',
  "  },",
  '  "scripts": {',
  '    "build": "tsc -p tsconfig.json",',
  '    "check-types": "tsc -p tsconfig.json --noEmit",',
  '    "start": "node dist/src/index.js",',
  '    "prepack": "npm run build"',
  "  },",
  '  "dependencies": {',
  '    "@type-x/runtime": "{{TYPEX_VERSION}}"',
  "  },",
  '  "devDependencies": {',
  '    "@types/node": "^25.6.0",',
  '    "typescript": "^5.9.2"',
  "  }",
  "}",
  "",
].join("\n");

const X_PACKAGE_ENTRY_TEMPLATE = [
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
  '  context.log.info("hello from {{COMMAND_NAME}}");',
  "  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);",
  "  context.log.info(`command: ${context.command.name}`);",
  "  context.log.info(`runs: ${runs}`);",
  "}",
  "",
].join("\n");

const STANDALONE_ENTRY_TEMPLATE = [
  'import { initCli, type CommandContext } from "@type-x/runtime";',
  "",
  "type Store = {",
  "  runs: number;",
  "};",
  "",
  "async function main(",
  "  context: CommandContext<Store>,",
  "): Promise<void> {",
  '  const previousRuns = (await context.store.get("runs")) ?? 0;',
  "  const runs = previousRuns + 1;",
  "",
  '  await context.store.set("runs", runs);',
  "",
  '  context.log.info("hello from {{COMMAND_NAME}}");',
  "  context.log.info(`package: ${context.command.packageName}@${context.command.version}`);",
  "  context.log.info(`command: ${context.command.name}`);",
  "  context.log.info(`runs: ${runs}`);",
  "}",
  "",
  "initCli(main);",
  "",
].join("\n");

const X_PACKAGE_README_TEMPLATE = [
  "# {{PACKAGE_NAME}}",
  "",
  "Command package for `x`.",
  "",
  "## Command",
  "",
  "`{{COMMAND_NAME}}`",
  "",
  "## Development",
  "",
  "```bash",
  "pnpm install",
  "pnpm build",
  "x run . {{COMMAND_NAME}}",
  "```",
  "",
  "## Install Into x",
  "",
  "```bash",
  "x add {{PACKAGE_NAME}}",
  "x {{COMMAND_NAME}}",
  "```",
  "",
].join("\n");

const STANDALONE_README_TEMPLATE = [
  "# {{PACKAGE_NAME}}",
  "",
  "Standalone CLI powered by `@type-x/runtime`.",
  "",
  "## Command",
  "",
  "`{{COMMAND_NAME}}`",
  "",
  "## Development",
  "",
  "```bash",
  "pnpm install",
  "pnpm build",
  "node dist/src/index.js",
  "```",
  "",
  "## Package",
  "",
  "Publishing this package exposes the `{{COMMAND_NAME}}` binary through npm.",
  "",
].join("\n");
