"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class;

var _chunkFDQWQVEPcjs = require('./chunk-FDQWQVEP.cjs');


var _chunkJ2LQ25K6cjs = require('./chunk-J2LQ25K6.cjs');
require('./chunk-ICOI2EVK.cjs');




var _chunkNLT4IVE6cjs = require('./chunk-NLT4IVE6.cjs');


var _chunkEC6JY3PVcjs = require('./chunk-EC6JY3PV.cjs');

// src/langchain.ts
var parseRole = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (ids) => {
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
var convertToLunaryMessages = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (input) => {
  const parseMessage = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (raw) => {
    if (typeof raw === "string")
      return raw;
    if ("message" in raw)
      return parseMessage(raw.message);
    const message = JSON.parse(JSON.stringify(raw));
    try {
      const role = parseRole(message.id);
      const obj = message.kwargs;
      const content = _nullishCoalesce(message.text, () => ( obj.content));
      return {
        role,
        content,
        ..._nullishCoalesce(obj.additional_kwargs, () => ( {}))
      };
    } catch (e) {
      return _nullishCoalesce(message.text, () => ( message));
    }
  }, "parseMessage");
  if (Array.isArray(input)) {
    return input.length === 1 ? convertToLunaryMessages(input[0]) : input.map(convertToLunaryMessages);
  }
  return parseMessage(input);
}, "convertToLunaryMessages");
var parseInput = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (rawInput) => {
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
var parseOutput = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (rawOutput) => {
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
var parseExtraAndName = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (llm, extraParams, metadata) => {
  const allParams = {
    ..._nullishCoalesce(_optionalChain([extraParams, 'optionalAccess', _ => _.invocation_params]), () => ( {})),
    // @ts-ignore this is a valid property
    ..._nullishCoalesce(_optionalChain([llm, 'optionalAccess', _2 => _2.kwargs]), () => ( {})),
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
var LunaryHandler = (_class = class extends _chunkNLT4IVE6cjs.BaseCallbackHandler {
  static {
    _chunkEC6JY3PVcjs.__name.call(void 0, this, "LunaryHandler");
  }
  __init() {this.name = "lunary_handler"}
  
  constructor(fields = {}) {
    super(fields);_class.prototype.__init.call(this);;
    this.lunary = _chunkJ2LQ25K6cjs.src_default;
    if (fields) {
      const { appId, apiUrl, publicKey, verbose } = fields;
      this.lunary.init({
        verbose,
        publicKey: _nullishCoalesce(_nullishCoalesce(_nullishCoalesce(_nullishCoalesce(publicKey, () => ( appId)), () => ( _chunkNLT4IVE6cjs.getEnvironmentVariable.call(void 0, "LUNARY_PUBLIC_KEY"))), () => ( _chunkNLT4IVE6cjs.getEnvironmentVariable.call(void 0, "LUNARY_APP_ID"))), () => ( _chunkNLT4IVE6cjs.getEnvironmentVariable.call(void 0, "LLMONITOR_APP_ID"))),
        apiUrl: _nullishCoalesce(_nullishCoalesce(apiUrl, () => ( _chunkNLT4IVE6cjs.getEnvironmentVariable.call(void 0, "LUNARY_API_URL"))), () => ( _chunkNLT4IVE6cjs.getEnvironmentVariable.call(void 0, "LLMONITOR_API_URL")))
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
        completion: _optionalChain([llmOutput, 'optionalAccess', _3 => _3.tokenUsage, 'optionalAccess', _4 => _4.completionTokens]),
        prompt: _optionalChain([llmOutput, 'optionalAccess', _5 => _5.tokenUsage, 'optionalAccess', _6 => _6.promptTokens])
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
      summary: _optionalChain([doc, 'access', _7 => _7.pageContent, 'optionalAccess', _8 => _8.length]) > 400 ? doc.pageContent.slice(0, 400) + "..." : doc.pageContent,
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
}, _class);
var replaceDoubleCurlyBraces = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (str) => str.replaceAll("{{", "{").replaceAll("}}", "}"), "replaceDoubleCurlyBraces");
async function getLangChainTemplate(slug) {
  const template = await _chunkJ2LQ25K6cjs.src_default.renderTemplate(slug);
  if (template.prompt) {
    const text = replaceDoubleCurlyBraces(template.prompt);
    const prompt = _chunkNLT4IVE6cjs.PromptTemplate.fromTemplate(text);
    return prompt;
  } else {
    const messages = template.messages.map((message) => {
      const text = replaceDoubleCurlyBraces(message.content);
      return [
        message.role.replace("user", "human").replace("assistant", "ai"),
        text
      ];
    });
    const prompt = _chunkFDQWQVEPcjs.ChatPromptTemplate.fromMessages(messages);
    return prompt;
  }
}
_chunkEC6JY3PVcjs.__name.call(void 0, getLangChainTemplate, "getLangChainTemplate");



exports.LunaryHandler = LunaryHandler; exports.getLangChainTemplate = getLangChainTemplate;
