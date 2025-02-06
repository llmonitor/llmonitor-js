"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class; var _class2;

var _chunkEC6JY3PVcjs = require('./chunk-EC6JY3PV.cjs');

// src/utils.ts
var checkEnv = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (variable) => {
  if (typeof process !== "undefined" && _optionalChain([process, 'access', _2 => _2.env, 'optionalAccess', _3 => _3[variable]])) {
    return process.env[variable];
  }
  if (typeof Deno !== "undefined" && _optionalChain([Deno, 'access', _4 => _4.env, 'optionalAccess', _5 => _5.get, 'call', _6 => _6(variable)])) {
    return Deno.env.get(variable);
  }
  return void 0;
}, "checkEnv");
var formatLog = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (event) => {
  return JSON.stringify(event, null, 2);
}, "formatLog");
var debounce = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (func, timeout = 500) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(void 0, args);
    }, timeout);
  };
}, "debounce");
var cleanError = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (error) => {
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
}, "cleanError");
var cleanExtra = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (extra) => {
  return Object.fromEntries(Object.entries(extra).filter(([_, v]) => v != null));
}, "cleanExtra");
var compileTemplate = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (content, variables) => {
  const regex = /{{(.*?)}}/g;
  return content.replace(regex, (_, g1) => variables[g1] || "");
}, "compileTemplate");
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
_chunkEC6JY3PVcjs.__name.call(void 0, getArgumentNames, "getArgumentNames");
var getFunctionInput = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (func, args) => {
  const argNames = getArgumentNames(func);
  const input = argNames.length === 1 ? args[0] : argNames.reduce((obj, argName, index) => {
    obj[argName] = args[index];
    return obj;
  }, {});
  return input;
}, "getFunctionInput");
var generateUUID = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, () => {
  let d = (/* @__PURE__ */ new Date()).getTime(), d2 = typeof performance !== "undefined" && performance.now && performance.now() * 1e3 || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c == "x" ? r : r & 7 | 8).toString(16);
  });
}, "generateUUID");
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
_chunkEC6JY3PVcjs.__name.call(void 0, sleep, "sleep");
var teeAsync = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (iterable) => {
  const AsyncIteratorProto = Object.getPrototypeOf(
    Object.getPrototypeOf(async function* () {
    }.prototype)
  );
  const iterator = iterable[Symbol.asyncIterator]();
  const buffers = [[], []];
  function makeIterator(buffer, i) {
    const iter = Object.assign(Object.create(AsyncIteratorProto), {
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
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    });
    return Object.assign(iter, {
      controller: iterable.controller
      // Copy any other important properties you need to preserve
    });
  }
  _chunkEC6JY3PVcjs.__name.call(void 0, makeIterator, "makeIterator");
  return buffers.map(makeIterator);
}, "teeAsync");

// src/thread.ts
var Thread = (_class = class {
  static {
    _chunkEC6JY3PVcjs.__name.call(void 0, this, "Thread");
  }
  
  
  
  
  
  
  constructor(monitor, options) {;_class.prototype.__init.call(this);_class.prototype.__init2.call(this);_class.prototype.__init3.call(this);_class.prototype.__init4.call(this);
    this.monitor = monitor;
    this.id = _optionalChain([options, 'optionalAccess', _7 => _7.id]) || generateUUID();
    this.started = _optionalChain([options, 'optionalAccess', _8 => _8.started]) || false;
    if (_optionalChain([options, 'optionalAccess', _9 => _9.tags]))
      this.tags = _optionalChain([options, 'optionalAccess', _10 => _10.tags]);
    if (_optionalChain([options, 'optionalAccess', _11 => _11.userId]))
      this.userId = _optionalChain([options, 'optionalAccess', _12 => _12.userId]);
    if (_optionalChain([options, 'optionalAccess', _13 => _13.userProps]))
      this.userProps = _optionalChain([options, 'optionalAccess', _14 => _14.userProps]);
  }
  /**
   * Track a new message from the user
   *
   * @param {Message} message - The message to track
   * @returns {string} - The message ID, to reconcile with feedback and backend LLM calls
   * */
  __init() {this.trackMessage = (message) => {
    const runId = _nullishCoalesce(message.id, () => ( generateUUID()));
    this.monitor.trackEvent("thread", "chat", {
      runId,
      parentRunId: this.id,
      threadTags: this.tags,
      userId: this.userId,
      userProps: this.userProps,
      feedback: message.feedback,
      message
    });
    return runId;
  }}
  /**
   * Track a new message from the user
   *
   * @deprecated Use trackMessage instead
   *
   * @param {string} text - The user message
   * @param {cJSON} props - Extra properties to send with the message
   * @param {string} customId - Set a custom ID for the message
   * @returns {string} - The message ID, to reconcile with the bot's reply
   * */
  __init2() {this.trackUserMessage = (text, props, customId) => {
    const runId = _nullishCoalesce(customId, () => ( generateUUID()));
    if (!this.started) {
      this.monitor.trackEvent("thread", "start", {
        runId: this.id,
        input: text
      });
      this.started = true;
    }
    this.monitor.trackEvent("chat", "start", {
      runId,
      input: text,
      parentRunId: this.id,
      extra: props
    });
    return runId;
  }}
  /**
   * Track a new message from the bot
   *
   * @deprecated Use trackMessage instead
   *
   * @param {string} replyToId - The message ID to reply to
   * @param {string} text - The bot message
   * @param {cJSON} props - Extra properties to send with the message
   * */
  __init3() {this.trackBotMessage = (replyToId, text, props) => {
    this.monitor.trackEvent("chat", "end", {
      runId: replyToId,
      output: text,
      extra: props
    });
  }}
  /**
   * Track a custom event in the thread
   *
   * @param {string} eventName - The name of the event
   * @param {cJSON} [metadata] - Optional metadata associated with the event
   */
  __init4() {this.trackEvent = (eventName, metadata) => {
    this.monitor.trackEvent("thread", "custom-event", {
      name: eventName,
      runId: generateUUID(),
      userId: this.userId,
      userProps: this.userProps,
      parentRunId: this.id,
      metadata
    });
  }}
}, _class);

// src/lunary.ts
var MAX_CHUNK_SIZE = 20;
var Lunary = (_class2 = class {
  static {
    _chunkEC6JY3PVcjs.__name.call(void 0, this, "Lunary");
  }
  
  
  
  
  
  
  __init5() {this.queue = []}
  __init6() {this.queueRunning = false}
  __init7() {this.templateCache = {}}
  __init8() {this.didWarnAboutAppId = false}
  /**
   * @param {LunaryOptions} options
   */
  constructor(ctx) {;_class2.prototype.__init5.call(this);_class2.prototype.__init6.call(this);_class2.prototype.__init7.call(this);_class2.prototype.__init8.call(this);_class2.prototype.__init9.call(this);_class2.prototype.__init10.call(this);_class2.prototype.__init11.call(this);_class2.prototype.__init12.call(this);_class2.prototype.__init13.call(this);_class2.prototype.__init14.call(this);
    this.init({
      publicKey: checkEnv("LUNARY_PRIVATE_KEY") || checkEnv("LUNARY_PUBLIC_KEY") || checkEnv("LUNARY_APP_ID") || checkEnv("LLMONITOR_APP_ID"),
      privateKey: checkEnv("LUNARY_PRIVATE_KEY"),
      apiUrl: checkEnv("LUNARY_API_URL") || checkEnv("LLMONITOR_API_URL") || "https://api.lunary.ai",
      runtime: "lunary-js",
      verbose: checkEnv("LUNARY_VERBOSE") === "true" || false
    });
    this.ctx = ctx;
  }
  init({
    appId,
    publicKey,
    privateKey,
    verbose,
    apiUrl,
    runtime
  } = {}) {
    if (appId)
      this.publicKey = appId;
    if (publicKey)
      this.publicKey = publicKey;
    if (privateKey)
      this.privateKey = privateKey;
    if (verbose)
      this.verbose = verbose;
    if (apiUrl)
      this.apiUrl = apiUrl;
    if (runtime)
      this.runtime = runtime;
  }
  /**
   * Manually track a run event.
   * @param {RunType} type - The type of the run.
   * @param {EventName} event - The name of the event.
   * @param {Partial<RunEvent>} data - The data associated with the event.
   * @example
   * monitor.trackEvent("llm", "start", { name: "gpt-4", input: "Hello I'm a bot" });
   */
  trackEvent(type, event, data) {
    if (!this.publicKey && !this.didWarnAboutAppId) {
      this.didWarnAboutAppId = true;
      return console.warn(
        "Lunary: Project ID not set. Not reporting anything. Get one on the dashboard: https://app.lunary.ai"
      );
    }
    let timestamp = Date.now();
    const lastEvent = _optionalChain([this, 'access', _15 => _15.queue, 'optionalAccess', _16 => _16[this.queue.length - 1]]);
    if (_optionalChain([lastEvent, 'optionalAccess', _17 => _17.timestamp]) >= timestamp) {
      timestamp = lastEvent.timestamp + 1;
    }
    const parentRunId = _nullishCoalesce(data.parentRunId, () => ( _optionalChain([this, 'access', _18 => _18.ctx, 'optionalAccess', _19 => _19.runId, 'access', _20 => _20.tryUse, 'call', _21 => _21()])));
    const user = _optionalChain([this, 'access', _22 => _22.ctx, 'optionalAccess', _23 => _23.user, 'optionalAccess', _24 => _24.tryUse, 'call', _25 => _25()]);
    const userId = _nullishCoalesce(data.userId, () => ( _optionalChain([user, 'optionalAccess', _26 => _26.userId])));
    let userProps = _nullishCoalesce(data.userProps, () => ( _optionalChain([user, 'optionalAccess', _27 => _27.userProps])));
    if (userProps && !userId) {
      console.warn(
        "Lunary: userProps passed without userId. Ignoring userProps."
      );
      userProps = void 0;
    }
    const runtime = _nullishCoalesce(data.runtime, () => ( this.runtime));
    const eventData = {
      event,
      type,
      userId,
      userProps,
      parentRunId,
      timestamp,
      runtime,
      ...cleanExtra(data)
    };
    if (this.verbose) {
      console.log(formatLog(eventData));
    }
    this.queue.push(eventData);
    if (this.queue.length > MAX_CHUNK_SIZE) {
      this.processQueue();
    } else {
      this.debouncedProcessQueue();
    }
  }
  // Wait 500ms to allow other events to be added to the queue
  __init9() {this.debouncedProcessQueue = debounce(() => this.processQueue())}
  async processQueue() {
    if (!this.queue.length || this.queueRunning)
      return;
    this.queueRunning = true;
    try {
      if (this.verbose)
        console.log(`Lunary: Sending events now to ${this.apiUrl}`);
      const copy = this.queue.slice();
      await fetch(`${this.apiUrl}/v1/runs/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (this.privateKey || this.publicKey)
        },
        body: JSON.stringify({ events: copy })
      });
      if (this.verbose)
        console.log("Lunary: Events sent");
      this.queue = this.queue.slice(copy.length);
      this.queueRunning = false;
      if (this.queue.length)
        this.processQueue();
    } catch (error) {
      this.queueRunning = false;
      console.error("Error sending event(s) to Lunary", error);
    }
  }
  /**
   * Get a dataset's runs from the API.
   * @param {string} datasetSlug - The slug of the dataset to get.
   * @returns {Promise<Run[]>} The dataset's runs.
   */
  __init10() {this.getDataset = async (datasetId) => {
    try {
      const response = await fetch(`${this.apiUrl}/v1/datasets/${datasetId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (this.privateKey || this.publicKey)
        }
      });
      const data = await response.json();
      return data.runs;
    } catch (e) {
      throw new Error(
        `Lunary: Error fetching dataset: you must be on the Unlimited or Enterprise plan to use this feature.`
      );
    }
  }}
  /**
   * Get a raw template's data from the API.
   * @param {string} slug - The slug of the template to get.
   * @returns {Promise<RawTemplate>} The template data.
   * @example
   * const template = await lunary.getRawTemplate("welcome")
   * console.log(template)
   */
  __init11() {this.getRawTemplate = async (slug) => {
    const cacheEntry = this.templateCache[slug];
    const now = Date.now();
    if (cacheEntry && now - cacheEntry.timestamp < 6e4) {
      return cacheEntry.data;
    }
    const response = await fetch(
      `${this.apiUrl}/v1/template_versions/latest?slug=${slug}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (this.privateKey || this.publicKey)
        }
      }
    );
    if (!response.ok) {
      throw new Error(
        `Lunary: Error fetching template: ${response.statusText || response.status} - ${await response.text()}`
      );
    }
    const data = await response.json();
    this.templateCache[slug] = { timestamp: now, data };
    return data;
  }}
  /**
   * Render a template with the given data in the OpenAI completion format.
   * @param {string} slug - The slug of the template to render.
   * @param {any} data - The data to pass to the template.
   * @returns {Promise<Template>} The rendered template.
   * @example
   * const template = await lunary.renderTemplate("welcome", { name: "John" })
   * console.log(template)
   */
  __init12() {this.renderTemplate = async (slug, data) => {
    const { id: templateId, content, extra } = await this.getRawTemplate(slug);
    const textMode = typeof content === "string";
    try {
      const rendered = textMode ? compileTemplate(content, data) : content.map((t) => ({
        ...t,
        content: compileTemplate(t.content, data)
      }));
      return {
        ...extra,
        [textMode ? "prompt" : "messages"]: rendered,
        templateId
      };
    } catch (error) {
      throw new Error(`Error rendering template ${slug} - ` + error.message);
    }
  }}
  /**
   * Attach feedback to a message or run directly.
   * @param {string} runId - The ID of the message or the run.
   * @param {cJSON} feedback - The feedback to attach.
   * @example
   * monitor.trackFeedback("some-id", { thumbs: "up" });
   **/
  __init13() {this.trackFeedback = (runId, feedback, overwrite = false) => {
    if (!runId || typeof runId !== "string")
      return console.error("Lunary: No message ID provided to track feedback");
    if (typeof feedback !== "object")
      return console.error(
        "Lunary: Invalid feedback provided. Pass a valid object"
      );
    this.trackEvent(null, "feedback", {
      runId,
      overwrite,
      feedback
    });
  }}
  /**
   * Get feedback for a message or run.
   * @param {string} runId - The ID of the message or the run.
   */
  __init14() {this.getFeedback = async (runId) => {
    if (!runId || typeof runId !== "string")
      return console.error("Lunary: No message ID provided to get feedback");
    const response = await fetch(`${this.apiUrl}/v1/runs/${runId}/feedback`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (this.privateKey || this.publicKey)
      }
    });
    if (!response.ok) {
      throw new Error(
        `Lunary: Error fetching feedback: ${response.statusText || response.status} - ${await response.text()}`
      );
    }
    const data = await response.json();
    return data;
  }}
  /**
   * @deprecated Use openThread() instead
   */
  startChat(id) {
    return new Thread(this, { id });
  }
  /**
   * @deprecated Use openThread() instead
   */
  startThread(id) {
    return new Thread(this, { id });
  }
  /**
   * @deprecated Use openThread() instead
   */
  resumeThread(id) {
    return new Thread(this, { id, started: true });
  }
  openThread(params) {
    return new Thread(
      this,
      typeof params === "string" ? { id: params } : params
    );
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
      message = _nullishCoalesce(error.message, () => ( void 0));
    }
    this.trackEvent("log", "error", {
      message,
      extra: cleanError(error)
    });
  }
  /**
   * Make sure the queue is flushed before exiting the program
   */
  async flush() {
    if (!this.queueRunning) {
      return await this.processQueue();
    }
    let counter = 0;
    while (this.queueRunning) {
      sleep(100);
      counter++;
      if (counter === 10) {
        break;
      }
    }
  }
}, _class2);
var lunary_default = Lunary;








exports.cleanError = cleanError; exports.cleanExtra = cleanExtra; exports.getFunctionInput = getFunctionInput; exports.generateUUID = generateUUID; exports.teeAsync = teeAsync; exports.lunary_default = lunary_default;
