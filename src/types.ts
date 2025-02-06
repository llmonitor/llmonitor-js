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
  appId?: string // deprecated
  publicKey?: string
  privateKey?: string
  apiUrl?: string
  verbose?: boolean
  runtime?: string
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
  | "custom-event"

export interface Event {
  type: RunType
  event: EventName
  timestamp: number
  userId?: string
  userProps?: cJSON
  parentRunId?: string
  params?: cJSON
  metadata?: cJSON
  extra?: cJSON // @deprecated
  tags?: string[]
  runtime?: string
  templateId?: string
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

// Based on OpenAI's ChatCompletionContentPart
export type ChatMessageBlock =
  | {
      type: "text"
      text: string
    }
  | {
      type: "image_url"
      image_url: { url: string }
    }
  | {
      type: "input_audio"
      input_audio: { data: string; format: "wav" | "mp3" }
    }

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function" | "tool"
  content?: string | Array<ChatMessageBlock>
  [key: string]: cJSON
}

export type WrapExtras = {
  name?: string
  metadata?: cJSON
  params?: cJSON
  extra?: cJSON // @deprecated
  tags?: string[]
  userId?: string
  userProps?: cJSON
}

export type WrapParams<T extends WrappableFn> = {
  track?: boolean
  inputParser?: (...args: Parameters<T>) => cJSON
  metadataParser?: (...args: Parameters<T>) => cJSON
  paramsParser?: (...args: Parameters<T>) => cJSON
  nameParser?: (...args: Parameters<T>) => string
  outputParser?: (result: Awaited<ReturnType<T>>) => cJSON
  tagsParser?: (...args: Parameters<T>) => string[]
  userIdParser?: (...args: Parameters<T>) => string
  userPropsParser?: (...args: Parameters<T>) => cJSON
  templateParser?: (...args: Parameters<T>) => string
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
// types.ts

export type WrappedReturn<T extends WrappableFn> = Promise<
  Awaited<ReturnType<T>>
> & {
  runId: string
  identify: Identify<T>
  setParent: SetParent<T>
}

export type WrappedFn<T extends WrappableFn> = (
  ...args: Parameters<T>
) => WrappedReturn<T>

// Templates

export type Template = {
  templateId: string
  prompt?: string
  messages?: ChatMessage[]
}
