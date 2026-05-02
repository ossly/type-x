export interface CommandStore<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> {
  get<K extends keyof TStore>(key: K): Promise<TStore[K] | undefined>;
  get<K extends StorePath<TStore>>(
    key: K,
  ): Promise<StorePathValue<TStore, K> | undefined>;
  set<K extends keyof TStore>(key: K, value: TStore[K]): Promise<void>;
  set<K extends StorePath<TStore>>(
    key: K,
    value: StorePathValue<TStore, K>,
  ): Promise<void>;
  delete<K extends keyof TStore>(key: K): Promise<void>;
  delete<K extends StorePath<TStore>>(key: K): Promise<void>;
  has<K extends keyof TStore>(key: K): Promise<boolean>;
  has<K extends StorePath<TStore>>(key: K): Promise<boolean>;
  all(): Promise<Partial<TStore>>;
  clear(): Promise<void>;
}

export type StorePath<TValue> =
  NonNullable<TValue> extends Record<string, unknown>
    ? {
        [K in Extract<keyof NonNullable<TValue>, string>]: NonNullable<
          NonNullable<TValue>[K]
        > extends Record<string, unknown>
          ? K | `${K}.${StorePath<NonNullable<NonNullable<TValue>[K]>>}`
          : K;
      }[Extract<keyof NonNullable<TValue>, string>]
    : never;

export type StorePathValue<
  TValue,
  TPath extends string,
> = TPath extends keyof NonNullable<TValue>
  ? NonNullable<TValue>[TPath]
  : TPath extends `${infer Head}.${infer Rest}`
    ? StorePathValue<NonNullable<StorePathSegmentValue<TValue, Head>>, Rest>
    : StorePathSegmentValue<TValue, TPath>;

type StorePathSegmentValue<
  TValue,
  TSegment extends string,
> = TSegment extends keyof NonNullable<TValue>
  ? NonNullable<TValue>[TSegment]
  : {
      [K in Extract<keyof NonNullable<TValue>, string>]: TSegment extends `${K}`
        ? NonNullable<TValue>[K]
        : never;
    }[Extract<keyof NonNullable<TValue>, string>];

export interface CommandInvocation {
  raw: string;
  argv: string[];
}

export interface CommandRequest {
  raw: string;
  argv: string[];
  args: string[];
  flags: Record<string, string | boolean | string[] | boolean[]>;
  invocation: CommandInvocation;
  pwd: string;
  env: Record<string, string | undefined>;
}

export interface CommandMetadata {
  name: string;
  packageName: string;
  version: string;
  aliasUsed?: string;
}

export interface CommandLog {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface CommandFailOptions {
  exitCode?: number;
}

export interface CommandUi {
  confirm(message: string): Promise<boolean>;
  input(message: string): Promise<string>;
  task(message: string): CommandTask;
}

export interface CommandTask {
  update(message: string): void;
  done(message?: string): void;
  fail(message?: string): void;
}

export interface CommandExecOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  input?: string;
  mode?: "capture" | "inherit";
  silent?: boolean;
  throwOnError?: boolean;
  timeoutMs?: number;
}

export type CommandExecCommand = string | readonly [string, ...string[]];

export interface CommandExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CommandExecErrorDetails {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  cwd: string;
  mode: "capture" | "inherit";
}

export interface CommandExec {
  (
    command: CommandExecCommand,
    options?: CommandExecOptions,
  ): Promise<CommandExecResult>;
}

export interface CommandGitInfo {
  isRepository: boolean;
  rootDir?: string;
  branch?: string;
  originUrl?: string;
  repoName?: string;
  isDetachedHead?: boolean;
}

export interface CommandGit {
  getInfo(): Promise<CommandGitInfo>;
}

export interface CommandIoDownloadOptions {
  destination?: string;
  fileName?: string;
  overwrite?: boolean;
}

export interface CommandIoDownloadResult {
  path: string;
  fileName: string;
}

export interface CommandIo {
  expandPath(path: string): string;
  download(
    url: string,
    options?: CommandIoDownloadOptions,
  ): Promise<CommandIoDownloadResult>;
}

export interface CommandEnv {
  get(name: string): string | undefined;
  require(name: string): string;
  has(name: string): boolean;
}

export interface CommandContext<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> {
  command: CommandMetadata;
  request: CommandRequest;
  store: CommandStore<TStore>;
  log: CommandLog;
  ui: CommandUi;
  exec: CommandExec;
  git: CommandGit;
  io: CommandIo;
  env: CommandEnv;
  fail(message: string, options?: CommandFailOptions): never;
}

export type CommandHandler<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> = (context: CommandContext<TStore>) => Promise<void> | void;
