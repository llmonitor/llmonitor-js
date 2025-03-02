import lunary from "./index"
import { LunaryOptions, ChatMessage, cJSON } from "./types"

import { BaseRun, RunUpdate as BaseRunUpdate, KVMap } from "langsmith/schemas"

import { getEnvironmentVariable } from "@langchain/core/utils/env"
import { BaseMessage } from "@langchain/core/messages"
import { ChainValues } from "@langchain/core/utils/types"
import { LLMResult, Generation } from "@langchain/core/outputs"
import {
  BaseCallbackHandler,
  BaseCallbackHandlerInput,
} from "@langchain/core/callbacks/base"
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts"

import { Serialized } from "@langchain/core/load/serializable"

type Role = "user" | "assistant" | "system" | "function" | "tool"

// Langchain Helpers
// Input can be either a single message, an array of message, or an array of array of messages (batch requests)

const parseRole = (ids: string[]): Role => {
  const roleHint = ids[ids.length - 1]

  if (roleHint.includes("Human")) return "user"
  if (roleHint.includes("System")) return "system"
  if (roleHint.includes("AI")) return "assistant"
  if (roleHint.includes("Function")) return "function"
  if (roleHint.includes("Tool")) return "tool"

  return "assistant"
}

type Message = BaseMessage | Generation | string

type OutputMessage = ChatMessage | string

const PARAMS_TO_CAPTURE = [
  "stop",
  "stop_sequences",
  "function_call",
  "functions",
  "tools",
  "tool_choice",
  "response_format",
]

const convertToLunaryMessages = (
  input: Message | Message[] | Message[][]
): OutputMessage | OutputMessage[] | OutputMessage[][] => {
  const parseMessage = (raw: Message): OutputMessage => {
    if (typeof raw === "string") return raw
    // sometimes the message is nested in a "message" property
    if ("message" in raw) return parseMessage(raw.message as Message)

    // Serialize
    const message = JSON.parse(JSON.stringify(raw))

    try {
      // "id" contains an array describing the constructor, with last item actual schema type
      const role = parseRole(message.id)

      const obj = message.kwargs
      const content = message.text ?? obj.content

      return {
        role,
        content,
        ...(obj.additional_kwargs ?? {}),
      }
    } catch (e) {
      // if parsing fails, return the original message
      return message.text ?? message
    }
  }

  if (Array.isArray(input)) {
    // @ts-ignore Confuses the compiler
    return input.length === 1
      ? convertToLunaryMessages(input[0])
      : input.map(convertToLunaryMessages)
  }
  return parseMessage(input)
}

const parseInput = (rawInput: Record<string, unknown>) => {
  if (!rawInput) return null

  const { input, inputs, question } = rawInput

  if (input) return input
  if (inputs) return inputs
  if (question) return question

  return rawInput
}

const parseOutput = (rawOutput: Record<string, unknown>) => {
  if (!rawOutput) return null

  const { text, output, answer, result } = rawOutput

  if (text) return text
  if (answer) return answer
  if (output) return output
  if (result) return result

  return rawOutput
}

const parseExtraAndName = (
  llm: Serialized,
  extraParams?: KVMap,
  metadata?: KVMap
) => {
  const allParams = {
    ...(extraParams?.invocation_params ?? {}),
    // @ts-ignore this is a valid property
    ...(llm?.kwargs ?? {}),
    ...(metadata || {}),
  }

  const { model, model_name, modelName, model_id, userId, userProps, ...rest } =
    allParams

  const name = model || modelName || model_name || model_id || llm.id.at(-1)

  // Filter rest to only include params we want to capture
  const params = Object.fromEntries(
    Object.entries(rest).filter(([key]) => PARAMS_TO_CAPTURE.includes(key))
  ) as cJSON

  // parse metadata, everything except model & user data that may be passed in
  const cleanedMetadata = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) =>
        !PARAMS_TO_CAPTURE.includes(key) &&
        ![
          "model",
          "model_name",
          "modelName",
          "model_id",
          "userId",
          "userProps",
          "tags",
        ].includes(key) &&
        ["string", "number", "boolean"].includes(typeof metadata[key])
    )
  ) as cJSON

  return { name, params, cleanedMetadata, userId, userProps }
}

export interface Run extends BaseRun {
  id: string
  child_runs: this[]
  child_execution_order: number
}

export interface RunUpdate extends BaseRunUpdate {
  events: BaseRun["events"]
}

export interface LunaryHandlerFields
  extends BaseCallbackHandlerInput,
    LunaryOptions {}

export class LunaryHandler
  extends BaseCallbackHandler
  implements LunaryHandlerFields
{
  name = "lunary_handler"

  lunary: typeof lunary

  constructor(fields: LunaryHandlerFields = {}) {
    super(fields)

    this.lunary = lunary

    if (fields) {
      const { appId, apiUrl, publicKey, verbose } = fields

      this.lunary.init({
        verbose,
        publicKey:
          publicKey ??
          appId ??
          getEnvironmentVariable("LUNARY_PUBLIC_KEY") ??
          getEnvironmentVariable("LUNARY_APP_ID") ??
          getEnvironmentVariable("LLMONITOR_APP_ID"),
        apiUrl:
          apiUrl ??
          getEnvironmentVariable("LUNARY_API_URL") ??
          getEnvironmentVariable("LLMONITOR_API_URL"),
      })
    }
  }

  async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
    parentRunId?: string,
    extraParams?: KVMap,
    tags?: string[],
    metadata?: KVMap
  ): Promise<void> {
    const { name, params, cleanedMetadata, userId, userProps } =
      parseExtraAndName(llm, extraParams, metadata)

    await this.lunary.trackEvent("llm", "start", {
      runId,
      parentRunId,
      name,
      input: convertToLunaryMessages(prompts),
      params,
      metadata: cleanedMetadata,
      userId,
      userProps,
      tags,
      runtime: "langchain-js",
    })
  }

  async handleChatModelStart(
    llm: Serialized,
    messages: BaseMessage[][],
    runId: string,
    parentRunId?: string,
    extraParams?: KVMap,
    tags?: string[],
    metadata?: KVMap
  ): Promise<void> {
    const { name, params, cleanedMetadata, userId, userProps } =
      parseExtraAndName(llm, extraParams, metadata)

    await this.lunary.trackEvent("llm", "start", {
      runId,
      parentRunId,
      name,
      input: convertToLunaryMessages(messages),
      params,
      metadata: cleanedMetadata,
      userId,
      userProps,
      tags,
      runtime: "langchain-js",
    })
  }

  async handleLLMEnd(output: LLMResult, runId: string): Promise<void> {
    const { generations, llmOutput } = output

    await this.lunary.trackEvent("llm", "end", {
      runId,
      output: convertToLunaryMessages(generations),
      tokensUsage: {
        completion: llmOutput?.tokenUsage?.completionTokens,
        prompt: llmOutput?.tokenUsage?.promptTokens,
      },
    })
  }

  async handleLLMError(error: Error, runId: string): Promise<void> {
    await this.lunary.trackEvent("llm", "error", {
      runId,
      error,
    })
  }

  async handleChainStart(
    chain: Serialized,
    inputs: ChainValues,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: KVMap
  ): Promise<void> {
    const { agentName, name, userId, userProps, ...rest } = metadata || {}

    // allow the user to specify a name for the chain or agent
    const actualName = name || agentName || chain.id.at(-1)

    // Attempt to automatically detect if this is an agent or chain
    const runType =
      agentName || ["AgentExecutor", "PlanAndExecute"].includes(name)
        ? "agent"
        : "chain"

    await this.lunary.trackEvent(runType, "start", {
      runId,
      parentRunId,
      name: actualName,
      userId,
      userProps,
      input: parseInput(inputs) as cJSON,
      metadata: rest,
      tags,
      runtime: "langchain-js",
    })
  }

  async handleChainEnd(outputs: ChainValues, runId: string): Promise<void> {
    await this.lunary.trackEvent("chain", "end", {
      runId,
      output: parseOutput(outputs) as cJSON,
    })
  }

  async handleChainError(error: Error, runId: string): Promise<void> {
    await this.lunary.trackEvent("chain", "error", {
      runId,
      error,
    })
  }

  async handleRetrieverStart(
    retriever: Serialized,
    query: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: KVMap,
    name?: string
  ) {
    const { userId, userProps, ...rest } = metadata || {}
    const retrieverName = name || retriever.id.at(-1)

    await this.lunary.trackEvent("retriever", "start", {
      runId,
      parentRunId,
      name: retrieverName,
      userId,
      userProps,
      input: query,
      metadata: rest,
      tags,
      runtime: "langchain-js",
    })
  }

  async handleRetrieverEnd(
    documents: any[],
    runId: string,
    parentRunId?: string,
    tags?: string[]
  ): Promise<void> {
    const docMetadatas = documents.map((doc, i) => ({
      summary:
        doc.pageContent?.length > 400
          ? doc.pageContent.slice(0, 400) + "..."
          : doc.pageContent,
      ...doc.metadata,
    }))

    await this.lunary.trackEvent("retriever", "end", {
      runId,
      output: docMetadatas,
      tags,
    })
  }

  async handleToolStart(
    tool: Serialized,
    input: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: KVMap
  ): Promise<void> {
    const { toolName, userId, userProps, ...rest } = metadata || {}
    const name = toolName || tool.id.at(-1)

    await this.lunary.trackEvent("tool", "start", {
      runId,
      parentRunId,
      name,
      userId,
      userProps,
      input,
      metadata: rest,
      tags,
      runtime: "langchain-js",
    })
  }

  async handleToolEnd(output: string, runId: string): Promise<void> {
    await this.lunary.trackEvent("tool", "end", {
      runId,
      output,
    })
  }

  async handleToolError(error: Error, runId: string): Promise<void> {
    await this.lunary.trackEvent("tool", "error", {
      runId,
      error,
    })
  }
}
// replace {{ }} with { } for langchain templates format

const replaceDoubleCurlyBraces = (str: string) =>
  str.replaceAll("{{", "{").replaceAll("}}", "}")

export async function getLangChainTemplate(
  slug: string
): Promise<PromptTemplate | ChatPromptTemplate> {
  const template = await lunary.renderTemplate(slug)

  if (template.prompt) {
    const text = replaceDoubleCurlyBraces(template.prompt)
    const prompt = PromptTemplate.fromTemplate(text)
    return prompt
  } else {
    const messages: [string, string][] = template.messages.map((message) => {
      const text = replaceDoubleCurlyBraces(message.content as string)
      return [
        message.role.replace("user", "human").replace("assistant", "ai"),
        text,
      ]
    })

    const prompt = ChatPromptTemplate.fromMessages(messages)
    return prompt
  }
}
