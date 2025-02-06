type cJSON = string | number | boolean | null | undefined | {
    [x: string]: cJSON;
} | Array<cJSON>;
interface LunaryOptions {
    appId?: string;
    publicKey?: string;
    privateKey?: string;
    apiUrl?: string;
    verbose?: boolean;
    runtime?: string;
}
type RunType = "log" | "tool" | "agent" | "llm" | "chain" | "retriever" | "embed" | "thread" | "chat";
type EventName = "start" | "end" | "error" | "info" | "warn" | "feedback" | "chat" | "custom-event";
interface Event {
    type: RunType;
    event: EventName;
    timestamp: number;
    userId?: string;
    userProps?: cJSON;
    parentRunId?: string;
    params?: cJSON;
    metadata?: cJSON;
    extra?: cJSON;
    tags?: string[];
    runtime?: string;
    templateId?: string;
    error?: {
        message: string;
        stack?: string;
    };
}
type TokenUsage = {
    completion: number;
    prompt: number;
};
interface RunEvent extends Event {
    runId: string;
    input?: cJSON;
    output?: cJSON;
    tokensUsage?: TokenUsage;
    [key: string]: unknown;
}
interface LogEvent extends Event {
    message: string;
}
type ChatMessageBlock = {
    type: "text";
    text: string;
} | {
    type: "image_url";
    image_url: {
        url: string;
    };
} | {
    type: "input_audio";
    input_audio: {
        data: string;
        format: "wav" | "mp3";
    };
};
interface ChatMessage {
    role: "user" | "assistant" | "system" | "function" | "tool";
    content?: string | Array<ChatMessageBlock>;
    [key: string]: cJSON;
}
type WrapExtras = {
    name?: string;
    metadata?: cJSON;
    params?: cJSON;
    extra?: cJSON;
    tags?: string[];
    userId?: string;
    userProps?: cJSON;
};
type WrapParams<T extends WrappableFn> = {
    track?: boolean;
    inputParser?: (...args: Parameters<T>) => cJSON;
    metadataParser?: (...args: Parameters<T>) => cJSON;
    paramsParser?: (...args: Parameters<T>) => cJSON;
    nameParser?: (...args: Parameters<T>) => string;
    outputParser?: (result: Awaited<ReturnType<T>>) => cJSON;
    tagsParser?: (...args: Parameters<T>) => string[];
    userIdParser?: (...args: Parameters<T>) => string;
    userPropsParser?: (...args: Parameters<T>) => cJSON;
    templateParser?: (...args: Parameters<T>) => string;
    tokensUsageParser?: (result: Awaited<ReturnType<T>>) => Promise<TokenUsage>;
    enableWaitUntil?: (...args: Parameters<T>) => boolean;
    forceFlush?: (...args: Parameters<T>) => boolean;
    waitUntil?: (result: Awaited<ReturnType<T>>, onComplete: (any: any) => any, onError: (any: any) => any) => ReturnType<T>;
} & WrapExtras;
type WrappableFn = (...args: any[]) => any;
type Identify<T extends WrappableFn> = (userId: string, userProps?: cJSON) => WrappedReturn<T>;
type SetParent<T extends WrappableFn> = (runId: string) => WrappedReturn<T>;
type WrappedReturn<T extends WrappableFn> = Promise<Awaited<ReturnType<T>>> & {
    runId: string;
    identify: Identify<T>;
    setParent: SetParent<T>;
};
type WrappedFn<T extends WrappableFn> = (...args: Parameters<T>) => WrappedReturn<T>;
type Template = {
    templateId: string;
    prompt?: string;
    messages?: ChatMessage[];
};

export type { ChatMessage, ChatMessageBlock, Event, EventName, Identify, LogEvent, LunaryOptions, RunEvent, RunType, SetParent, Template, TokenUsage, WrapExtras, WrapParams, WrappableFn, WrappedFn, WrappedReturn, cJSON };
