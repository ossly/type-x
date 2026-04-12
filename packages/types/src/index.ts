export interface CommandStore<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> {
  get<K extends keyof TStore>(key: K): Promise<TStore[K] | undefined>;
  set<K extends keyof TStore>(key: K, value: TStore[K]): Promise<void>;
  delete<K extends keyof TStore>(key: K): Promise<void>;
  has<K extends keyof TStore>(key: K): Promise<boolean>;
  all(): Promise<Partial<TStore>>;
  clear(): Promise<void>;
}

export interface CommandInvocation {
  raw: string;
  argv: string[];
}

export interface CommandRequest {
  raw: string;
  argv: string[];
  args: string[];
  flags: Record<string, string | boolean>;
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
  rejectOnNonZero?: boolean;
}

export interface CommandExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CommandExec {
  (
    command: string,
    args?: string[],
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
}

export type CommandHandler<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> = (context: CommandContext<TStore>) => Promise<void> | void;
