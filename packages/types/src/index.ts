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

export interface CommandRequest {
  raw: string;
  argv: string[];
  args: string[];
  flags: Record<string, string | boolean>;
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

export interface CommandContext<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> {
  command: CommandMetadata;
  request: CommandRequest;
  store: CommandStore<TStore>;
  log: CommandLog;
}

export type CommandHandler<
  TStore extends Record<string, unknown> = Record<string, unknown>,
> = (context: CommandContext<TStore>) => Promise<void> | void;
