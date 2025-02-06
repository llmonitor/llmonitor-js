import { cleanError, generateUUID, getFunctionInput } from "./utils"

import { RunType, WrapParams, WrappableFn, WrappedFn } from "./types"

import ctx from "./context"
import chainable from "./chainable"

import Lunary from "./lunary"

// Extended Lunary class with backend-specific methods and context injection

class BackendMonitor extends Lunary {
  private wrap<T extends WrappableFn>(
    type: RunType,
    func: T,
    params?: WrapParams<T>
  ): WrappedFn<T> {
    const lunary = this

    const wrappedFn = (...args: Parameters<T>) => {
      // Generate a random ID for this run (will be injected into the context)
      const runId = generateUUID()

      // Don't pass the function directly to proxy to avoid it being called directly
      const callInfo = {
        type,
        func,
        runId,
        args,
        params,
      }

      const proxy = new Proxy(callInfo, {
        get: function (target, prop) {
          if (prop === "identify") {
            return chainable.identify.bind({
              target,
              next: lunary.executeWrappedFunction.bind(lunary),
            })
          }

          if (prop === "runId") {
            return target.runId
          }

          if (prop === "setParent") {
            return chainable.setParent.bind({
              target,
              next: lunary.executeWrappedFunction.bind(lunary),
            })
          }

          const promise = lunary.executeWrappedFunction(target)

          if (prop === "then") {
            return (onFulfilled, onRejected) =>
              promise.then(onFulfilled, onRejected)
          }

          if (prop === "catch") {
            return (onRejected) => promise.catch(onRejected)
          }

          if (prop === "finally") {
            return (onFinally) => promise.finally(onFinally)
          }
        },
      }) as unknown

      return proxy
    }

    return wrappedFn as WrappedFn<T>
  }

  // Extract the actual execution logic into a function
  private async executeWrappedFunction<T extends WrappableFn>(target) {
    const { runId, type, args, func, params: properties } = target

    // Get agent name from function name or params
    const name = properties?.nameParser
      ? properties.nameParser(...args)
      : properties?.name ?? func.name

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
      userProps,
    }: WrapParams<T> = properties || {}

    // Get extra data from function or params
    const paramsData = properties?.paramsParser
      ? properties.paramsParser(...args)
      : params || extra // extra is deprecated
    const metadataData = properties?.metadataParser
      ? properties.metadataParser(...args)
      : metadata

    const tagsData = properties?.tagsParser
      ? properties.tagsParser(...args)
      : tags

    const userIdData = properties?.userIdParser
      ? properties.userIdParser(...args)
      : userId

    const userPropsData = properties?.userPropsParser
      ? properties.userPropsParser(...args)
      : userProps

    const templateId = properties?.templateParser
      ? properties.templateParser(...args)
      : templateParser

    const input = inputParser
      ? inputParser(...args)
      : getFunctionInput(func, args)

    if (track !== false) {
      this.trackEvent(type, "start", {
        runId,
        input,
        name,
        params: paramsData,
        metadata: metadataData,
        tags: tagsData,
        userId: userIdData,
        userProps: userPropsData,
        templateId,
      })
    }

    const shouldWaitUntil =
      typeof enableWaitUntil === "function"
        ? enableWaitUntil(...args)
        : waitUntil

    const processOutput = async (output) => {
      // Allow parsing of token usage (useful for LLMs)
      const tokensUsage = tokensUsageParser
        ? await tokensUsageParser(output)
        : undefined

      this.trackEvent(type, "end", {
        runId,
        name, // need name in case need to count tokens usage server-side
        output: outputParser ? outputParser(output) : output,
        tokensUsage,
      })

      if (shouldWaitUntil) {
        // Process queue immediately, in case it's a stream, we can't ask the user to manually flush
        await this.flush()
      }
    }

    try {
      // Inject runId into context
      const output = await ctx.runId.callAsync(runId, async () => {
        return func(...args)
      })

      if (shouldWaitUntil) {
        // Support waiting for a callback to be called to complete the run
        // Useful for streaming API
        return waitUntil(
          output,
          (res) => processOutput(res),
          (error) => console.error(error)
        )
      } else if (track !== false) {
        await processOutput(output)
      }

      return output
    } catch (error) {
      if (track !== false) {
        this.trackEvent(type, "error", {
          runId,
          error: cleanError(error),
        })

        // Process queue immediately as if there is an uncaught exception next, it won't be processed
        // TODO: find a cleaner (and non platform-specific) way to do this
        await this.processQueue()
      }

      throw error
    }
  }

  /**
   * TODO: This is not functional yet
   * Wrap anything to inject user or message ID context.
   * @param {Promise} func - Function to wrap
   **/
  wrapContext<T extends WrappableFn>(func: T): WrappedFn<T> {
    return this.wrap(null, func, { track: false })
  }

  /**
   * Wrap an agent's Promise to track it's input, results and any errors.
   * An agent is a group of tools and llms that work together to achieve a goal.
   * @param {Promise} func - Agent function
   * @param {WrapParams} params - Wrap params
   */
  wrapAgent<T extends WrappableFn>(
    func: T,
    params?: WrapParams<T>
  ): WrappedFn<T> {
    return this.wrap("agent", func, params)
  }

  /**
   * Wrap an chain's Promise to track it's input, results and any errors.
   * A chain is a grouped sequence of actions (llms, tools and agents).
   * @param {Promise} func - Chain function
   * @param {WrapParams} params - Wrap params
   */
  wrapChain<T extends WrappableFn>(
    func: T,
    params?: WrapParams<T>
  ): WrappedFn<T> {
    return this.wrap("chain", func, params)
  }

  /**
   * Wrap an tool's Promise to track it's input, results and any errors.
   * @param {Promise} func - Tool function
   * @param {WrapParams} params - Wrap params
   */
  wrapTool<T extends WrappableFn>(
    func: T,
    params?: WrapParams<T>
  ): WrappedFn<T> {
    return this.wrap("tool", func, params)
  }

  /**
   * Wrap an model's Promise to track it's input, results and any errors.
   * @param {Promise} func - Model generation function
   * @param {WrapParams} params - Wrap params
   */
  wrapModel<T extends WrappableFn>(
    func: T,
    params?: WrapParams<T>
  ): WrappedFn<T> {
    return this.wrap("llm", func, params) as WrappedFn<T>
  }

  /**
   * Scores a run based on the provided label, value, and optional comment
   *
   * @param {string} runId - Unique run identifier
   * @param {string} label - Evaluation label
   * @param {number | string | boolean} value - Evaluation value
   * @param {string} [comment] - Optional evaluation comment
   */
  async score(
    runId: string,
    label: string,
    value: number | string | boolean,
    comment?: string
  ) {
    try {
      const url = `${this.apiUrl}/v1/runs/${runId}/score`
      const headers = {
        Authorization: `Bearer ${this.privateKey || this.publicKey}`,
        "Content-Type": "application/json",
      }

      const data = {
        label,
        value,
        ...(comment && { comment }),
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error scoring run: ${response.status} - ${text}`)
      }
    } catch (error) {
      throw new Error(`Error scoring run: ${error.message}`)
    }
  }
}

// Export the BackendMonitor class if user wants to initiate multiple instances
export { BackendMonitor as Monitor }

// Create a new instance of the monitor with the async context
const lunary = new BackendMonitor(ctx)

export default lunary
