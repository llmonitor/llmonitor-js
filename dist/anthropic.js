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

// src/anthropic.ts
var parseAnthropicMessage = /* @__PURE__ */ __name((message) => {
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
          usage.input_tokens = part.message.usage?.input_tokens;
        } else if (part.type === "content_block_delta") {
          content += part.delta.text;
        } else if (part.type === "message_delta" && part.usage?.output_tokens) {
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
  __name(handleStream, "handleStream");
  const wrapped = src_default.wrapModel(
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
        return cleanExtra(rawExtra);
      },
      metadataParser(request) {
        const metadata = request.metadata;
        return metadata;
      },
      outputParser: (res) => parseAnthropicMessage(res),
      tokensUsageParser: async (res) => {
        return {
          completion: res.usage?.output_tokens,
          prompt: res.usage?.input_tokens
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
        const [og, copy] = teeAsync(stream);
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
__name(monitorAnthropic, "monitorAnthropic");
export {
  monitorAnthropic
};
