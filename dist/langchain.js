import {
  ChatPromptTemplate
} from "./chunk-5WB2DFWV.js";
import {
  src_default
} from "./chunk-T564GHW5.js";
import "./chunk-AX3726TK.js";
import {
  BaseCallbackHandler,
  PromptTemplate,
  getEnvironmentVariable
} from "./chunk-NONCHV5C.js";
import {
  __name
} from "./chunk-AGSXOS4O.js";

// src/langchain.ts
var parseRole = /* @__PURE__ */ __name((ids) => {
  const roleHint = ids[ids.length - 1];
  if (roleHint.includes("Human"))
    return "user";
  if (roleHint.includes("System"))
    return "system";
  if (roleHint.includes("AI"))
    return "assistant";
  if (roleHint.includes("Function"))
    return "function";
  if (roleHint.includes("Tool"))
    return "tool";
  return "assistant";
}, "parseRole");
var PARAMS_TO_CAPTURE = [
  "stop",
  "stop_sequences",
  "function_call",
  "functions",
  "tools",
  "tool_choice",
  "response_format"
];
var convertToLunaryMessages = /* @__PURE__ */ __name((input) => {
  const parseMessage = /* @__PURE__ */ __name((raw) => {
    if (typeof raw === "string")
      return raw;
    if ("message" in raw)
      return parseMessage(raw.message);
    const message = JSON.parse(JSON.stringify(raw));
    try {
      const role = parseRole(message.id);
      const obj = message.kwargs;
      const content = message.text ?? obj.content;
      return {
        role,
        content,
        ...obj.additional_kwargs ?? {}
      };
    } catch (e) {
      return message.text ?? message;
    }
  }, "parseMessage");
  if (Array.isArray(input)) {
    return input.length === 1 ? convertToLunaryMessages(input[0]) : input.map(convertToLunaryMessages);
  }
  return parseMessage(input);
}, "convertToLunaryMessages");
var parseInput = /* @__PURE__ */ __name((rawInput) => {
  if (!rawInput)
    return null;
  const { input, inputs, question } = rawInput;
  if (input)
    return input;
  if (inputs)
    return inputs;
  if (question)
    return question;
  return rawInput;
}, "parseInput");
var parseOutput = /* @__PURE__ */ __name((rawOutput) => {
  if (!rawOutput)
    return null;
  const { text, output, answer, result } = rawOutput;
  if (text)
    return text;
  if (answer)
    return answer;
  if (output)
    return output;
  if (result)
    return result;
  return rawOutput;
}, "parseOutput");
var parseExtraAndName = /* @__PURE__ */ __name((llm, extraParams, metadata) => {
  const allParams = {
    ...extraParams?.invocation_params ?? {},
    // @ts-ignore this is a valid property
    ...llm?.kwargs ?? {},
    ...metadata || {}
  };
  const { model, model_name, modelName, model_id, userId, userProps, ...rest } = allParams;
  const name = model || modelName || model_name || model_id || llm.id.at(-1);
  const params = Object.fromEntries(
    Object.entries(rest).filter(([key]) => PARAMS_TO_CAPTURE.includes(key))
  );
  const cleanedMetadata = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => !PARAMS_TO_CAPTURE.includes(key) && ![
        "model",
        "model_name",
        "modelName",
        "model_id",
        "userId",
        "userProps",
        "tags"
      ].includes(key) && ["string", "number", "boolean"].includes(typeof metadata[key])
    )
  );
  return { name, params, cleanedMetadata, userId, userProps };
}, "parseExtraAndName");
var LunaryHandler = class extends BaseCallbackHandler {
  static {
    __name(this, "LunaryHandler");
  }
  name = "lunary_handler";
  lunary;
  constructor(fields = {}) {
    super(fields);
    this.lunary = src_default;
    if (fields) {
      const { appId, apiUrl, publicKey, verbose } = fields;
      this.lunary.init({
        verbose,
        publicKey: publicKey ?? appId ?? getEnvironmentVariable("LUNARY_PUBLIC_KEY") ?? getEnvironmentVariable("LUNARY_APP_ID") ?? getEnvironmentVariable("LLMONITOR_APP_ID"),
        apiUrl: apiUrl ?? getEnvironmentVariable("LUNARY_API_URL") ?? getEnvironmentVariable("LLMONITOR_API_URL")
      });
    }
  }
  async handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata) {
    const { name, params, cleanedMetadata, userId, userProps } = parseExtraAndName(llm, extraParams, metadata);
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
      runtime: "langchain-js"
    });
  }
  async handleChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata) {
    const { name, params, cleanedMetadata, userId, userProps } = parseExtraAndName(llm, extraParams, metadata);
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
      runtime: "langchain-js"
    });
  }
  async handleLLMEnd(output, runId) {
    const { generations, llmOutput } = output;
    await this.lunary.trackEvent("llm", "end", {
      runId,
      output: convertToLunaryMessages(generations),
      tokensUsage: {
        completion: llmOutput?.tokenUsage?.completionTokens,
        prompt: llmOutput?.tokenUsage?.promptTokens
      }
    });
  }
  async handleLLMError(error, runId) {
    await this.lunary.trackEvent("llm", "error", {
      runId,
      error
    });
  }
  async handleChainStart(chain, inputs, runId, parentRunId, tags, metadata) {
    const { agentName, name, userId, userProps, ...rest } = metadata || {};
    const actualName = name || agentName || chain.id.at(-1);
    const runType = agentName || ["AgentExecutor", "PlanAndExecute"].includes(name) ? "agent" : "chain";
    await this.lunary.trackEvent(runType, "start", {
      runId,
      parentRunId,
      name: actualName,
      userId,
      userProps,
      input: parseInput(inputs),
      metadata: rest,
      tags,
      runtime: "langchain-js"
    });
  }
  async handleChainEnd(outputs, runId) {
    await this.lunary.trackEvent("chain", "end", {
      runId,
      output: parseOutput(outputs)
    });
  }
  async handleChainError(error, runId) {
    await this.lunary.trackEvent("chain", "error", {
      runId,
      error
    });
  }
  async handleRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name) {
    const { userId, userProps, ...rest } = metadata || {};
    const retrieverName = name || retriever.id.at(-1);
    await this.lunary.trackEvent("retriever", "start", {
      runId,
      parentRunId,
      name: retrieverName,
      userId,
      userProps,
      input: query,
      metadata: rest,
      tags,
      runtime: "langchain-js"
    });
  }
  async handleRetrieverEnd(documents, runId, parentRunId, tags) {
    const docMetadatas = documents.map((doc, i) => ({
      summary: doc.pageContent?.length > 400 ? doc.pageContent.slice(0, 400) + "..." : doc.pageContent,
      ...doc.metadata
    }));
    await this.lunary.trackEvent("retriever", "end", {
      runId,
      output: docMetadatas,
      tags
    });
  }
  async handleToolStart(tool, input, runId, parentRunId, tags, metadata) {
    const { toolName, userId, userProps, ...rest } = metadata || {};
    const name = toolName || tool.id.at(-1);
    await this.lunary.trackEvent("tool", "start", {
      runId,
      parentRunId,
      name,
      userId,
      userProps,
      input,
      metadata: rest,
      tags,
      runtime: "langchain-js"
    });
  }
  async handleToolEnd(output, runId) {
    await this.lunary.trackEvent("tool", "end", {
      runId,
      output
    });
  }
  async handleToolError(error, runId) {
    await this.lunary.trackEvent("tool", "error", {
      runId,
      error
    });
  }
};
var replaceDoubleCurlyBraces = /* @__PURE__ */ __name((str) => str.replaceAll("{{", "{").replaceAll("}}", "}"), "replaceDoubleCurlyBraces");
async function getLangChainTemplate(slug) {
  const template = await src_default.renderTemplate(slug);
  if (template.prompt) {
    const text = replaceDoubleCurlyBraces(template.prompt);
    const prompt = PromptTemplate.fromTemplate(text);
    return prompt;
  } else {
    const messages = template.messages.map((message) => {
      const text = replaceDoubleCurlyBraces(message.content);
      return [
        message.role.replace("user", "human").replace("assistant", "ai"),
        text
      ];
    });
    const prompt = ChatPromptTemplate.fromMessages(messages);
    return prompt;
  }
}
__name(getLangChainTemplate, "getLangChainTemplate");
export {
  LunaryHandler,
  getLangChainTemplate
};
