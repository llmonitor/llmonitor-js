"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkJ2LQ25K6cjs = require('./chunk-J2LQ25K6.cjs');



var _chunkICOI2EVKcjs = require('./chunk-ICOI2EVK.cjs');


var _chunkEC6JY3PVcjs = require('./chunk-EC6JY3PV.cjs');

// src/openai.ts
var parseOpenaiMessage = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (message) => {
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
  const wrappedCreateChatCompletion = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (...args) => (
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
        if (_optionalChain([function_call, 'optionalAccess', _ => _.name]))
          choices[index].message.function_call.name = function_call.name;
        if (_optionalChain([function_call, 'optionalAccess', _2 => _2.arguments]))
          choices[index].message.function_call.arguments += function_call.arguments;
        if (tool_calls) {
          for (const tool_call of tool_calls) {
            const existingCallIndex = choices[index].message.tool_calls.findIndex((tc) => tc.index === tool_call.index);
            if (existingCallIndex === -1) {
              choices[index].message.tool_calls.push(tool_call);
            } else {
              const existingCall = choices[index].message.tool_calls[existingCallIndex];
              if (_optionalChain([tool_call, 'access', _3 => _3.function, 'optionalAccess', _4 => _4.arguments])) {
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
  _chunkEC6JY3PVcjs.__name.call(void 0, handleStream, "handleStream");
  const wrapped = _chunkJ2LQ25K6cjs.src_default.wrapModel(wrappedCreateChatCompletion, {
    nameParser: (request) => request.model,
    inputParser: (request) => request.messages.map(parseOpenaiMessage),
    paramsParser: (request) => {
      const rawExtra = {};
      for (const param of PARAMS_TO_CAPTURE) {
        if (request[param])
          rawExtra[param] = request[param];
      }
      return _chunkICOI2EVKcjs.cleanExtra.call(void 0, rawExtra);
    },
    metadataParser(request) {
      return request.metadata;
    },
    outputParser: (res) => parseOpenaiMessage(res.choices[0].message || ""),
    tokensUsageParser: async (res) => {
      return {
        completion: _optionalChain([res, 'access', _5 => _5.usage, 'optionalAccess', _6 => _6.completion_tokens]),
        prompt: _optionalChain([res, 'access', _7 => _7.usage, 'optionalAccess', _8 => _8.prompt_tokens])
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
      const [og, copy] = _chunkICOI2EVKcjs.teeAsync.call(void 0, stream);
      handleStream(copy, onComplete, onError);
      return og;
    },
    ...params
  });
  openai.chat.completions.create = wrapped;
  return openai;
}
_chunkEC6JY3PVcjs.__name.call(void 0, monitorOpenAI, "monitorOpenAI");


exports.monitorOpenAI = monitorOpenAI;
