import { WrapExtras, WrappedFn, Template, WrappedReturn, cJSON } from './types.js';
import OpenAI from 'openai';
import { APIPromise } from 'openai/core';
import OpenAIStreaming from 'openai/streaming';

type WrappedOldOpenAi<T> = Omit<T, "createChatCompletion"> & {
    createChatCompletion: WrappedFn<T["createChatCompletion"]>;
};
type CreateFunction<T, U> = (body: T, options?: OpenAI.RequestOptions) => U;
type NewParams = {
    tags?: string[];
    userProps?: cJSON;
};
type WrapCreateFunction<T, U> = (body: (T & NewParams) | Template, options?: OpenAI.RequestOptions) => WrappedReturn<CreateFunction<T, U>>;
type WrapCreate<T> = {
    chat: {
        completions: {
            create: WrapCreateFunction<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, APIPromise<OpenAI.ChatCompletion>> & WrapCreateFunction<OpenAI.Chat.ChatCompletionCreateParamsStreaming, APIPromise<OpenAIStreaming.Stream<OpenAI.ChatCompletionChunk>>> & WrapCreateFunction<OpenAI.Chat.ChatCompletionCreateParams, APIPromise<OpenAI.ChatCompletion> | APIPromise<OpenAIStreaming.Stream<OpenAI.ChatCompletionChunk>>>;
        };
    };
};
type WrappedOpenAi<T> = Omit<T, "chat"> & WrapCreate<T>;
declare function openAIv3<T extends any>(openai: T, params?: WrapExtras): WrappedOldOpenAi<T>;
declare function monitorOpenAI<T extends any>(openai: T, params?: WrapExtras): WrappedOpenAi<T>;

export { monitorOpenAI, openAIv3 };
