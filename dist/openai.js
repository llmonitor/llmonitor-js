import {
  src_default
} from "./chunk-T564GHW5.js";
import {
  cleanExtra,
  teeAsync
} from "./chunk-AX3726TK.js";
import {
  __name
} from "./chunk-AGSXOS4O.js";

// src/openai.ts
var parseOpenaiMessage = /* @__PURE__ */ __name((message) => {
  if (!message)
    return void 0;
  const {
    role,
    content,
    audio,
    refusal,
    name,
    function_call,
    tool_calls,
    tool_call_id
  } = message;
  return {
    role,
    content,
    audio,
    refusal,
    function_call,
    tool_calls,
    tool_call_id,
    name
  };
}, "parseOpenaiMessage");
var PARAMS_TO_CAPTURE = [
  "temperature",
  "top_p",
  "top_k",
  "stop",
  "audio",
  "prediction",
  "modalities",
  "presence_penalty",
  "frequency_penalty",
  "seed",
  "function_call",
  "service_tier",
  "parallel_tool_calls",
  "functions",
  "tools",
  "tool_choice",
  "top_logprobs",
  "logprobs",
  "response_format",
  "max_tokens",
  "max_completion_tokens",
  "logit_bias"
];
function monitorOpenAI(openai, params = {}) {
  const createChatCompletion = openai.chat.completions.create;
  const wrappedCreateChatCompletion = /* @__PURE__ */ __name((...args) => (
    // @ts-ignore
    createChatCompletion.apply(openai.chat.completions, args)
  ), "wrappedCreateChatCompletion");
  async function handleStream(stream, onComplete, onError) {
    try {
      let tokens = 0;
      let choices = [];
      for await (const part of stream) {
        tokens += 1;
        const chunk = part.choices[0];
        const { index, delta } = chunk;
        const { content, function_call, role, tool_calls } = delta;
        if (!choices[index]) {
          choices.splice(index, 0, {
            message: { role, content, function_call, tool_calls: [] }
          });
        }
        if (content)
          choices[index].message.content += content || "";
        if (role)
          choices[index].message.role = role;
        if (function_call?.name)
          choices[index].message.function_call.name = function_call.name;
        if (function_call?.arguments)
          choices[index].message.function_call.arguments += function_call.arguments;
        if (tool_calls) {
          for (const tool_call of tool_calls) {
            const existingCallIndex = choices[index].message.tool_calls.findIndex((tc) => tc.index === tool_call.index);
            if (existingCallIndex === -1) {
              choices[index].message.tool_calls.push(tool_call);
            } else {
              const existingCall = choices[index].message.tool_calls[existingCallIndex];
              if (tool_call.function?.arguments) {
                existingCall.function.arguments += tool_call.function.arguments;
              }
            }
          }
        }
      }
      choices = choices.map((c) => {
        if (c.message.tool_calls) {
          c.message.tool_calls = c.message.tool_calls.map((tc) => {
            const { index, ...rest } = tc;
            return rest;
          });
        }
        return c;
      });
      const res = {
        choices,
        usage: { completion_tokens: tokens, prompt_tokens: void 0 }
      };
      onComplete(res);
    } catch (error) {
      console.error(error);
      onError(error);
    }
  }
  __name(handleStream, "handleStream");
  const wrapped = src_default.wrapModel(wrappedCreateChatCompletion, {
    nameParser: (request) => request.model,
    inputParser: (request) => request.messages.map(parseOpenaiMessage),
    paramsParser: (request) => {
      const rawExtra = {};
      for (const param of PARAMS_TO_CAPTURE) {
        if (request[param])
          rawExtra[param] = request[param];
      }
      return cleanExtra(rawExtra);
    },
    metadataParser(request) {
      return request.metadata;
    },
    outputParser: (res) => parseOpenaiMessage(res.choices[0].message || ""),
    tokensUsageParser: async (res) => {
      return {
        completion: res.usage?.completion_tokens,
        prompt: res.usage?.prompt_tokens
      };
    },
    tagsParser: (request) => {
      const t = request.tags;
      delete request.tags;
      return t;
    },
    userIdParser: (request) => request.user,
    userPropsParser: (request) => {
      const props = request.userProps;
      delete request.userProps;
      return props;
    },
    templateParser: (request) => {
      const templateId = request.templateId;
      delete request.templateId;
      delete request.prompt;
      return templateId;
    },
    enableWaitUntil: (request) => !!request.stream,
    waitUntil: (stream, onComplete, onError) => {
      const [og, copy] = teeAsync(stream);
      handleStream(copy, onComplete, onError);
      return og;
    },
    ...params
  });
  openai.chat.completions.create = wrapped;
  return openai;
}
__name(monitorOpenAI, "monitorOpenAI");
export {
  monitorOpenAI
};
