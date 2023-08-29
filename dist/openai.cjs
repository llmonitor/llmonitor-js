var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/openai.ts
var openai_exports = {};
__export(openai_exports, {
  monitorOpenAI: () => monitorOpenAI,
  openAIv3: () => openAIv3
});
module.exports = __toCommonJS(openai_exports);

// src/utils.ts
var checkEnv = (variable) => {
  if (typeof process !== "undefined" && process.env?.[variable]) {
    return process.env[variable];
  }
  if (typeof Deno !== "undefined" && Deno.env?.get(variable)) {
    return Deno.env.get(variable);
  }
  return void 0;
};
var formatLog = (event) => {
  return JSON.stringify(event, null, 2);
};
var debounce = (func, timeout = 500) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(void 0, args);
    }, timeout);
  };
};
var cleanError = (error) => {
  if (typeof error === "string")
    return {
      message: error
    };
  else if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  } else {
    error = new Error("Unknown error");
    return {
      message: error.message,
      stack: error.stack
    };
  }
};
var cleanExtra = (extra) => {
  return Object.fromEntries(Object.entries(extra).filter(([_, v]) => v != null));
};
function getArgumentNames(func) {
  let str = func.toString();
  str = str.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/(.)*/g, "").replace(/{[\s\S]*}/, "").replace(/=>/g, "").trim();
  const start = str.indexOf("(") + 1;
  const end = str.length - 1;
  const result = str.substring(start, end).split(",").map((el) => el.trim());
  const params = [];
  result.forEach((element) => {
    element = element.replace(/=[\s\S]*/g, "").trim();
    if (element.length > 0)
      params.push(element);
  });
  return params;
}
var getFunctionInput = (func, args) => {
  const argNames = getArgumentNames(func);
  const input = argNames.length === 1 ? args[0] : argNames.reduce((obj, argName, index) => {
    obj[argName] = args[index];
    return obj;
  }, {});
  return input;
};

// src/context.ts
var import_unctx = require("unctx");
var import_node_async_hooks = require("async_hooks");
var runId = (0, import_unctx.createContext)({
  asyncContext: true,
  AsyncLocalStorage: import_node_async_hooks.AsyncLocalStorage
});
var user = (0, import_unctx.createContext)({
  asyncContext: true,
  AsyncLocalStorage: import_node_async_hooks.AsyncLocalStorage
});
var context_default = {
  runId,
  user
};

// src/chainable.ts
async function identify(userId, userProps) {
  const { target, next } = this;
  const context = {
    userId,
    userProps
  };
  return context_default.user.callAsync(context, async () => {
    return next(target);
  });
}
var chainable_default = {
  identify
};

// src/llmonitor.ts
var LLMonitor = class {
  appId;
  logConsole;
  apiUrl;
  queue = [];
  queueRunning = false;
  /**
   * @param {LLMonitorOptions} options
   */
  constructor() {
    this.load({
      appId: checkEnv("LLMONITOR_APP_ID"),
      log: false,
      apiUrl: checkEnv("LLMONITOR_API_URL") || "https://app.llmonitor.com"
    });
  }
  load({ appId, log, apiUrl } = {}) {
    if (appId)
      this.appId = appId;
    if (log)
      this.logConsole = log;
    if (apiUrl)
      this.apiUrl = apiUrl;
  }
  async trackEvent(type, event, data) {
    if (!this.appId)
      return console.error("LLMonitor: App ID not set. Not reporting anything.");
    let timestamp = Date.now();
    const lastEvent = this.queue?.[this.queue.length - 1];
    if (lastEvent?.timestamp >= timestamp) {
      timestamp = lastEvent.timestamp + 1;
    }
    const parentRunId = data.parentRunId ?? context_default.runId.tryUse();
    const user2 = context_default.user.tryUse();
    const eventData = {
      event,
      type,
      userId: user2?.userId,
      userProps: user2?.userProps,
      app: this.appId,
      parentRunId,
      timestamp,
      ...data
    };
    if (this.logConsole) {
      console.log(formatLog(eventData));
    }
    this.queue.push(eventData);
    this.debouncedProcessQueue();
  }
  // Wait 500ms to allow other events to be added to the queue
  debouncedProcessQueue = debounce(() => this.processQueue());
  async processQueue() {
    if (!this.queue.length || this.queueRunning)
      return;
    this.queueRunning = true;
    try {
      const copy = this.queue.slice();
      await fetch(`${this.apiUrl}/api/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ events: copy })
      });
      this.queue = this.queue.slice(copy.length);
      this.queueRunning = false;
      if (this.queue.length)
        this.processQueue();
    } catch (error) {
      this.queueRunning = false;
      console.warn("Error sending event(s) to LLMonitor", error);
    }
  }
  wrap(type, func, params) {
    const llmonitor2 = this;
    const wrappedFn = (...args) => {
      const callInfo = {
        type,
        func,
        args,
        params
      };
      const proxy = new Proxy(callInfo, {
        get: function(target, prop) {
          if (prop === "identify") {
            return chainable_default.identify.bind({
              target,
              next: llmonitor2.executeWrappedFunction.bind(llmonitor2)
            });
          }
          const promise = llmonitor2.executeWrappedFunction(target);
          if (prop === "then") {
            return (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected);
          }
          if (prop === "catch") {
            return (onRejected) => promise.catch(onRejected);
          }
          if (prop === "finally") {
            return (onFinally) => promise.finally(onFinally);
          }
        }
      });
      return proxy;
    };
    return wrappedFn;
  }
  // Extract the actual execution logic into a function
  async executeWrappedFunction(target) {
    const { type, args, func, params } = target;
    const runId2 = crypto.randomUUID();
    const name = params?.nameParser ? params.nameParser(...args) : params?.name ?? func.name;
    const {
      inputParser,
      outputParser,
      tokensUsageParser,
      waitUntil,
      enableWaitUntil,
      extra,
      tags,
      userId,
      userProps
    } = params || {};
    const extraData = params?.extraParser ? params.extraParser(...args) : extra;
    const input = inputParser ? inputParser(...args) : getFunctionInput(func, args);
    this.trackEvent(type, "start", {
      runId: runId2,
      input,
      name,
      extra: extraData,
      tags
    });
    const processOutput = async (output) => {
      const tokensUsage = tokensUsageParser ? await tokensUsageParser(output) : void 0;
      this.trackEvent(type, "end", {
        runId: runId2,
        output: outputParser ? outputParser(output) : output,
        tokensUsage
      });
    };
    try {
      const output = await context_default.runId.callAsync(runId2, async () => {
        return func(...args);
      });
      if (typeof enableWaitUntil === "function" ? enableWaitUntil(...args) : waitUntil) {
        return waitUntil(
          output,
          (res) => processOutput(res),
          (error) => console.error(error)
        );
      } else {
        await processOutput(output);
      }
      return output;
    } catch (error) {
      this.trackEvent(type, "error", {
        runId: runId2,
        error: cleanError(error)
      });
      await this.processQueue();
      throw error;
    }
  }
  /**
   * Wrap an agent's Promise to track it's input, results and any errors.
   * @param {Promise} func - Agent function
   * @param {WrapParams} params - Wrap params
   */
  wrapAgent(func, params) {
    return this.wrap("agent", func, params);
  }
  /**
   * Wrap an tool's Promise to track it's input, results and any errors.
   * @param {Promise} func - Tool function
   * @param {WrapParams} params - Wrap params
   */
  wrapTool(func, params) {
    return this.wrap("tool", func, params);
  }
  /**
   * Wrap an model's Promise to track it's input, results and any errors.
   * @param {Promise} func - Model generation function
   * @param {WrapParams} params - Wrap params
   */
  wrapModel(func, params) {
    return this.wrap("llm", func, params);
  }
  /**
   * Use this to log any external action or tool you use.
   * @param {string} message - Log message
   * @param {any} extra - Extra data to pass
   * @example
   * monitor.info("Running tool Google Search")
   **/
  info(message, extra) {
    this.trackEvent("log", "info", {
      message,
      extra
    });
  }
  log(message, extra) {
    this.info(message, extra);
  }
  /**
   * Use this to warn
   * @param {string} message - Warning message
   * @param {any} extra - Extra data to pass
   * @example
   * monitor.log("Running tool Google Search")
   **/
  warn(message, extra) {
    this.trackEvent("log", "warn", {
      message,
      extra
    });
  }
  /**
   * Report any errors that occur during the conversation.
   * @param {string} message - Error message
   * @param {any} error - Error object
   * @example
   * try {
   *   const answer = await model.generate("Hello")
   *   monitor.result(answer)
   * } catch (error) {
   *   monitor.error("Error generating answer", error)
   * }
   */
  error(message, error) {
    if (typeof message === "object") {
      error = message;
      message = error.message ?? void 0;
    }
    this.trackEvent("log", "error", {
      message,
      extra: cleanError(error)
    });
  }
};
var llmonitor_default = LLMonitor;

// src/index.ts
var llmonitor = new llmonitor_default();
var src_default = llmonitor;

// src/openai.ts
var parseOpenaiMessage = (message) => {
  if (!message)
    return void 0;
  const { role, content, name, function_call } = message;
  return {
    role: role.replace("assistant", "ai"),
    text: content,
    function_call
  };
};
var teeAsync = (iterable) => {
  const AsyncIteratorProto = Object.getPrototypeOf(
    Object.getPrototypeOf(async function* () {
    }.prototype)
  );
  const iterator = iterable[Symbol.asyncIterator]();
  const buffers = [[], []];
  function makeIterator(buffer, i) {
    return Object.assign(Object.create(AsyncIteratorProto), {
      next() {
        if (!buffer)
          return Promise.resolve({ done: true, value: void 0 });
        if (buffer.length)
          return buffer.shift();
        const res = iterator.next();
        if (buffers[i ^ 1])
          buffers[i ^ 1].push(res);
        return res;
      },
      async return() {
        if (buffer) {
          buffer = buffers[i] = null;
          if (!buffers[i ^ 1])
            await iterator.return();
        }
        return { done: true, value: void 0 };
      }
    });
  }
  return buffers.map(makeIterator);
};
function openAIv3(openai, params = {}) {
  const createChatCompletion = openai.createChatCompletion.bind(openai);
  const wrapped = src_default.wrapModel(createChatCompletion, {
    nameParser: (request) => request.model,
    inputParser: (request) => request.messages.map(parseOpenaiMessage),
    extraParser: (request) => {
      const rawExtra = {
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        frequencyPenalty: request.frequency_penalty,
        presencePenalty: request.presence_penalty,
        stop: request.stop
      };
      return cleanExtra(rawExtra);
    },
    outputParser: ({ data }) => parseOpenaiMessage(data.choices[0].text || ""),
    tokensUsageParser: async ({ data }) => ({
      completion: data.usage?.completion_tokens,
      prompt: data.usage?.prompt_tokens
    }),
    ...params
  });
  openai.createChatCompletion = wrapped;
  return openai;
}
function monitorOpenAI(openai, params = {}) {
  const createChatCompletion = openai.chat.completions.create.bind(openai);
  async function handleStream(stream, onComplete, onError) {
    try {
      let tokens = 0;
      let choices = [];
      for await (const part of stream) {
        tokens += 1;
        const chunk = part.choices[0];
        const { index, delta } = chunk;
        const { content, function_call, role } = delta;
        if (!choices[index]) {
          choices.splice(index, 0, {
            message: { role, content, function_call }
          });
          continue;
        }
        if (content)
          choices[index].message.content += content;
        if (role)
          choices[index].message.role = role;
        if (function_call?.name)
          choices[index].message.function_call.name = function_call.name;
        if (function_call?.arguments)
          choices[index].message.function_call.arguments += function_call.arguments;
      }
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
  const wrapped = src_default.wrapModel(createChatCompletion, {
    nameParser: (request) => request.model,
    inputParser: (request) => request.messages.map(parseOpenaiMessage),
    extraParser: (request) => {
      const rawExtra = {
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        frequencyPenalty: request.frequency_penalty,
        presencePenalty: request.presence_penalty,
        stop: request.stop
      };
      return cleanExtra(rawExtra);
    },
    outputParser: (res) => parseOpenaiMessage(res.choices[0].message || ""),
    tokensUsageParser: async (res) => {
      return {
        completion: res.usage?.completion_tokens,
        prompt: res.usage?.prompt_tokens
      };
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  monitorOpenAI,
  openAIv3
});
