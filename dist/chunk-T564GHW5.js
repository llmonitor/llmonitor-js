import {
  cleanError,
  generateUUID,
  getFunctionInput,
  lunary_default
} from "./chunk-AX3726TK.js";
import {
  __name
} from "./chunk-AGSXOS4O.js";

// src/context.ts
import { createContext } from "unctx";
import { AsyncLocalStorage } from "node:async_hooks";
var runId = createContext({
  asyncContext: true,
  AsyncLocalStorage
});
var user = createContext({
  asyncContext: true,
  AsyncLocalStorage
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
__name(identify, "identify");
async function setParent(runId2) {
  const { target, next } = this;
  return context_default.runId.callAsync(runId2, async () => {
    return next(target);
  });
}
__name(setParent, "setParent");
var chainable_default = {
  identify,
  setParent
};

// src/index.ts
var BackendMonitor = class extends lunary_default {
  static {
    __name(this, "BackendMonitor");
  }
  wrap(type, func, params) {
    const lunary2 = this;
    const wrappedFn = /* @__PURE__ */ __name((...args) => {
      const runId2 = generateUUID();
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
    const name = properties?.nameParser ? properties.nameParser(...args) : properties?.name ?? func.name;
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
    const paramsData = properties?.paramsParser ? properties.paramsParser(...args) : params || extra;
    const metadataData = properties?.metadataParser ? properties.metadataParser(...args) : metadata;
    const tagsData = properties?.tagsParser ? properties.tagsParser(...args) : tags;
    const userIdData = properties?.userIdParser ? properties.userIdParser(...args) : userId;
    const userPropsData = properties?.userPropsParser ? properties.userPropsParser(...args) : userProps;
    const templateId = properties?.templateParser ? properties.templateParser(...args) : templateParser;
    const input = inputParser ? inputParser(...args) : getFunctionInput(func, args);
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
    const processOutput = /* @__PURE__ */ __name(async (output) => {
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
          error: cleanError(error)
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

export {
  BackendMonitor,
  src_default
};
