"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }




var _chunkICOI2EVKcjs = require('./chunk-ICOI2EVK.cjs');


var _chunkEC6JY3PVcjs = require('./chunk-EC6JY3PV.cjs');

// src/context.ts
var _unctx = require('unctx');
var _async_hooks = require('async_hooks');
var runId = _unctx.createContext.call(void 0, {
  asyncContext: true,
  AsyncLocalStorage: _async_hooks.AsyncLocalStorage
});
var user = _unctx.createContext.call(void 0, {
  asyncContext: true,
  AsyncLocalStorage: _async_hooks.AsyncLocalStorage
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
_chunkEC6JY3PVcjs.__name.call(void 0, identify, "identify");
async function setParent(runId2) {
  const { target, next } = this;
  return context_default.runId.callAsync(runId2, async () => {
    return next(target);
  });
}
_chunkEC6JY3PVcjs.__name.call(void 0, setParent, "setParent");
var chainable_default = {
  identify,
  setParent
};

// src/index.ts
var BackendMonitor = class extends _chunkICOI2EVKcjs.lunary_default {
  static {
    _chunkEC6JY3PVcjs.__name.call(void 0, this, "BackendMonitor");
  }
  wrap(type, func, params) {
    const lunary2 = this;
    const wrappedFn = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, (...args) => {
      const runId2 = _chunkICOI2EVKcjs.generateUUID.call(void 0, );
      const callInfo = {
        type,
        func,
        runId: runId2,
        args,
        params
      };
      const proxy = new Proxy(callInfo, {
        get: function(target, prop) {
          if (prop === "identify") {
            return chainable_default.identify.bind({
              target,
              next: lunary2.executeWrappedFunction.bind(lunary2)
            });
          }
          if (prop === "runId") {
            return target.runId;
          }
          if (prop === "setParent") {
            return chainable_default.setParent.bind({
              target,
              next: lunary2.executeWrappedFunction.bind(lunary2)
            });
          }
          const promise = lunary2.executeWrappedFunction(target);
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
    }, "wrappedFn");
    return wrappedFn;
  }
  // Extract the actual execution logic into a function
  async executeWrappedFunction(target) {
    const { runId: runId2, type, args, func, params: properties } = target;
    const name = _optionalChain([properties, 'optionalAccess', _ => _.nameParser]) ? properties.nameParser(...args) : _nullishCoalesce(_optionalChain([properties, 'optionalAccess', _2 => _2.name]), () => ( func.name));
    const {
      inputParser,
      outputParser,
      tokensUsageParser,
      templateParser,
      waitUntil,
      enableWaitUntil,
      extra,
      metadata,
      params,
      tags,
      track,
      userId,
      userProps
    } = properties || {};
    const paramsData = _optionalChain([properties, 'optionalAccess', _3 => _3.paramsParser]) ? properties.paramsParser(...args) : params || extra;
    const metadataData = _optionalChain([properties, 'optionalAccess', _4 => _4.metadataParser]) ? properties.metadataParser(...args) : metadata;
    const tagsData = _optionalChain([properties, 'optionalAccess', _5 => _5.tagsParser]) ? properties.tagsParser(...args) : tags;
    const userIdData = _optionalChain([properties, 'optionalAccess', _6 => _6.userIdParser]) ? properties.userIdParser(...args) : userId;
    const userPropsData = _optionalChain([properties, 'optionalAccess', _7 => _7.userPropsParser]) ? properties.userPropsParser(...args) : userProps;
    const templateId = _optionalChain([properties, 'optionalAccess', _8 => _8.templateParser]) ? properties.templateParser(...args) : templateParser;
    const input = inputParser ? inputParser(...args) : _chunkICOI2EVKcjs.getFunctionInput.call(void 0, func, args);
    if (track !== false) {
      this.trackEvent(type, "start", {
        runId: runId2,
        input,
        name,
        params: paramsData,
        metadata: metadataData,
        tags: tagsData,
        userId: userIdData,
        userProps: userPropsData,
        templateId
      });
    }
    const shouldWaitUntil = typeof enableWaitUntil === "function" ? enableWaitUntil(...args) : waitUntil;
    const processOutput = /* @__PURE__ */ _chunkEC6JY3PVcjs.__name.call(void 0, async (output) => {
      const tokensUsage = tokensUsageParser ? await tokensUsageParser(output) : void 0;
      this.trackEvent(type, "end", {
        runId: runId2,
        name,
        // need name in case need to count tokens usage server-side
        output: outputParser ? outputParser(output) : output,
        tokensUsage
      });
      if (shouldWaitUntil) {
        await this.flush();
      }
    }, "processOutput");
    try {
      const output = await context_default.runId.callAsync(runId2, async () => {
        return func(...args);
      });
      if (shouldWaitUntil) {
        return waitUntil(
          output,
          (res) => processOutput(res),
          (error) => console.error(error)
        );
      } else if (track !== false) {
        await processOutput(output);
      }
      return output;
    } catch (error) {
      if (track !== false) {
        this.trackEvent(type, "error", {
          runId: runId2,
          error: _chunkICOI2EVKcjs.cleanError.call(void 0, error)
        });
        await this.processQueue();
      }
      throw error;
    }
  }
  /**
   * TODO: This is not functional yet
   * Wrap anything to inject user or message ID context.
   * @param {Promise} func - Function to wrap
   **/
  wrapContext(func) {
    return this.wrap(null, func, { track: false });
  }
  /**
   * Wrap an agent's Promise to track it's input, results and any errors.
   * An agent is a group of tools and llms that work together to achieve a goal.
   * @param {Promise} func - Agent function
   * @param {WrapParams} params - Wrap params
   */
  wrapAgent(func, params) {
    return this.wrap("agent", func, params);
  }
  /**
   * Wrap an chain's Promise to track it's input, results and any errors.
   * A chain is a grouped sequence of actions (llms, tools and agents).
   * @param {Promise} func - Chain function
   * @param {WrapParams} params - Wrap params
   */
  wrapChain(func, params) {
    return this.wrap("chain", func, params);
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
   * Scores a run based on the provided label, value, and optional comment
   *
   * @param {string} runId - Unique run identifier
   * @param {string} label - Evaluation label
   * @param {number | string | boolean} value - Evaluation value
   * @param {string} [comment] - Optional evaluation comment
   */
  async score(runId2, label, value, comment) {
    try {
      const url = `${this.apiUrl}/v1/runs/${runId2}/score`;
      const headers = {
        Authorization: `Bearer ${this.privateKey || this.publicKey}`,
        "Content-Type": "application/json"
      };
      const data = {
        label,
        value,
        ...comment && { comment }
      };
      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error scoring run: ${response.status} - ${text}`);
      }
    } catch (error) {
      throw new Error(`Error scoring run: ${error.message}`);
    }
  }
};
var lunary = new BackendMonitor(context_default);
var src_default = lunary;




exports.BackendMonitor = BackendMonitor; exports.src_default = src_default;
