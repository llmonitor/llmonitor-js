"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkJ2LQ25K6cjs = require('./chunk-J2LQ25K6.cjs');



var _chunkICOI2EVKcjs = require('./chunk-ICOI2EVK.cjs');


var _chunkEC6JY3PVcjs = require('./chunk-EC6JY3PV.cjs');

// src/anthropic.ts
var parseAnthropicMessage = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (message) => {
  if (!message)
    return void 0;
  if (typeof message.content === "string") {
    return {
      role: message.role,
      content: message.content
    };
  }
  const mappedContent = message.content.map((block) => {
    if (block.type === "text") {
      return {
        type: "text",
        text: block.text
      };
    } else if (block.type === "image") {
      return {
        type: "image_url",
        image_url: {
          url: `data:${block.source.media_type};base64,${block.source.data}`
        }
      };
    }
    return block;
  });
  return {
    role: message.role,
    content: mappedContent
  };
}, "parseAnthropicMessage");
var PARAMS_TO_CAPTURE = [
  "max_tokens",
  "stop_sequences",
  "temperature",
  "tool_choice",
  "tools",
  "top_p",
  "top_k"
];
function monitorAnthropic(anthropic, params = {}) {
  const createMessage = anthropic.messages.create;
  async function handleStream(stream, onComplete, onError) {
    try {
      let content = "";
      let role = "";
      let usage = {
        input_tokens: 0,
        output_tokens: 0
      };
      for await (const part of stream) {
        if (part.type === "message_start") {
          role = part.message.role;
          usage.input_tokens = _optionalChain([part, 'access', _ => _.message, 'access', _2 => _2.usage, 'optionalAccess', _3 => _3.input_tokens]);
        } else if (part.type === "content_block_delta") {
          content += part.delta.text;
        } else if (part.type === "message_delta" && _optionalChain([part, 'access', _4 => _4.usage, 'optionalAccess', _5 => _5.output_tokens])) {
          usage.output_tokens = part.usage.output_tokens;
        }
      }
      const res = {
        content,
        role,
        usage
      };
      onComplete(res);
    } catch (error) {
      console.error(error);
      onError(error);
    }
  }
  _chunkEC6JY3PVcjs.__name.call(void 0, handleStream, "handleStream");
  const wrapped = _chunkJ2LQ25K6cjs.src_default.wrapModel(
    // @ts-ignore
    (...args) => createMessage.apply(anthropic.messages, args),
    {
      nameParser: (request) => request.model,
      inputParser: (request) => {
        const messages = request.messages.map(parseAnthropicMessage);
        if (request.system) {
          messages.unshift(
            parseAnthropicMessage({
              role: "system",
              content: request.system
            })
          );
        }
        return messages;
      },
      paramsParser: (request) => {
        const rawExtra = {};
        for (const param of PARAMS_TO_CAPTURE) {
          if (request[param])
            rawExtra[param] = request[param];
        }
        return _chunkICOI2EVKcjs.cleanExtra.call(void 0, rawExtra);
      },
      metadataParser(request) {
        const metadata = request.metadata;
        return metadata;
      },
      outputParser: (res) => parseAnthropicMessage(res),
      tokensUsageParser: async (res) => {
        return {
          completion: _optionalChain([res, 'access', _6 => _6.usage, 'optionalAccess', _7 => _7.output_tokens]),
          prompt: _optionalChain([res, 'access', _8 => _8.usage, 'optionalAccess', _9 => _9.input_tokens])
        };
      },
      tagsParser: (request) => {
        const t = request.tags;
        delete request.tags;
        return t;
      },
      userIdParser: (request) => {
        const userId = request.userId;
        delete request.userId;
        return userId;
      },
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
    }
  );
  const wrappedAnthropicMessages = anthropic.messages;
  wrappedAnthropicMessages.create = wrapped;
  return anthropic;
}
_chunkEC6JY3PVcjs.__name.call(void 0, monitorAnthropic, "monitorAnthropic");


exports.monitorAnthropic = monitorAnthropic;
