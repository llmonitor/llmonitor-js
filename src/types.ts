// using 'JSON' causes problems with esbuild (probably because a type JSON alrady exists)
export type cJSON =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [x: string]: cJSON }
  | Array<cJSON>

export interface LunaryOptions {
  appId?: string
  apiUrl?: string
  verbose?: boolean
}

export type RunType =
  | "log"
  | "tool"
  | "agent"
  | "llm"
  | "chain"
  | "retriever"
  | "embed"
  | "thread"
  | "chat"

export type EventName =
  | "start"
  | "end"
  | "error"
  | "info"
  | "warn"
  | "feedback"
  | "chat"

export interface Event {
  type: RunType
  event: EventName
  app: string
  timestamp: number
  userId?: string
  userProps?: cJSON
  parentRunId?: string
  extra?: cJSON
  tags?: string[]
  runtime?: string
  error?: {
    message: string
    stack?: string
  }
}

export type TokenUsage = {
  completion: number
  prompt: number
}

export interface RunEvent extends Event {
  runId: string
  input?: cJSON
  output?: cJSON
  tokensUsage?: TokenUsage
  [key: string]: unknown
}

export interface LogEvent extends Event {
  message: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function" | "tool"

  content?: string
  [key: string]: cJSON
}

export type WrapExtras = {
  name?: string
  extra?: cJSON
  tags?: string[]
  userId?: string
  userProps?: cJSON
}

export type WrapParams<T extends WrappableFn> = {
  inputParser?: (...args: Parameters<T>) => cJSON
  extraParser?: (...args: Parameters<T>) => cJSON
  nameParser?: (...args: Parameters<T>) => string
  outputParser?: (result: Awaited<ReturnType<T>>) => cJSON
  tagsParser?: (...args: Parameters<T>) => string[]
  userIdParser?: (...args: Parameters<T>) => string
  userPropsParser?: (...args: Parameters<T>) => cJSON
  tokensUsageParser?: (result: Awaited<ReturnType<T>>) => Promise<TokenUsage>
  // Add the option to wait for a condition to be met before completing the run
  // Useful for streaming API
  enableWaitUntil?: (...args: Parameters<T>) => boolean
  forceFlush?: (...args: Parameters<T>) => boolean
  waitUntil?: (
    result: Awaited<ReturnType<T>>,
    onComplete: (any) => any,
    onError: (any) => any
  ) => ReturnType<T>
} & WrapExtras

export type WrappableFn = (...args: any[]) => any

export type Identify<T extends WrappableFn> = (
  userId: string,
  userProps?: cJSON
) => WrappedReturn<T>

export type SetParent<T extends WrappableFn> = (
  runId: string
) => WrappedReturn<T>

export type WrappedReturn<T extends WrappableFn> = ReturnType<T> & {
  identify: Identify<T>
  setParent: SetParent<T>
}

// Create a type for the function returning that promise
export type WrappedFn<T extends WrappableFn> = (
  ...args: Parameters<T>
) => WrappedReturn<T>

// Templates

export interface Template {
  template: string
  text?: string
  messages?: ChatMessage[]
  model?: string
  temperature?: number
  top_p?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  stop?: string[]
  function?: any
  n?: number
}
