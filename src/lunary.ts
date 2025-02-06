import {
  checkEnv,
  cleanError,
  compileTemplate,
  debounce,
  cleanExtra,
  formatLog,
  sleep,
} from "./utils"

import {
  Event,
  EventName,
  RunType,
  LunaryOptions,
  LogEvent,
  RunEvent,
  cJSON,
  Template,
} from "./types"

import { Thread } from "./thread"

const MAX_CHUNK_SIZE = 20

class Lunary {
  publicKey?: string
  privateKey?: string
  verbose?: boolean
  apiUrl?: string
  ctx?: any
  runtime?: string

  queue: any[] = []
  private queueRunning: boolean = false

  private templateCache: Record<string, { timestamp: number; data: any }> = {}
  private didWarnAboutAppId = false

  /**
   * @param {LunaryOptions} options
   */
  constructor(ctx?) {
    this.init({
      publicKey:
        checkEnv("LUNARY_PRIVATE_KEY") ||
        checkEnv("LUNARY_PUBLIC_KEY") ||
        checkEnv("LUNARY_APP_ID") ||
        checkEnv("LLMONITOR_APP_ID"),
      privateKey: checkEnv("LUNARY_PRIVATE_KEY"),
      apiUrl:
        checkEnv("LUNARY_API_URL") ||
        checkEnv("LLMONITOR_API_URL") ||
        "https://api.lunary.ai",
      runtime: "lunary-js",
      verbose: checkEnv("LUNARY_VERBOSE") === "true" || false,
    })

    this.ctx = ctx
  }

  init({
    appId,
    publicKey,
    privateKey,
    verbose,
    apiUrl,
    runtime,
  }: LunaryOptions = {}) {
    if (appId) this.publicKey = appId
    if (publicKey) this.publicKey = publicKey
    if (privateKey) this.privateKey = privateKey
    if (verbose) this.verbose = verbose
    if (apiUrl) this.apiUrl = apiUrl
    if (runtime) this.runtime = runtime
  }

  /**
   * Manually track a run event.
   * @param {RunType} type - The type of the run.
   * @param {EventName} event - The name of the event.
   * @param {Partial<RunEvent>} data - The data associated with the event.
   * @example
   * monitor.trackEvent("llm", "start", { name: "gpt-4", input: "Hello I'm a bot" });
   */
  trackEvent(
    type: RunType,
    event: EventName,
    data: Partial<RunEvent | LogEvent>
  ): void {
    if (!this.publicKey && !this.didWarnAboutAppId) {
      this.didWarnAboutAppId = true
      return console.warn(
        "Lunary: Project ID not set. Not reporting anything. Get one on the dashboard: https://app.lunary.ai"
      )
    }

    // Add 1ms to timestamp if it's the same/lower than the last event
    // Keep the order of events in case they are sent in the same millisecond
    let timestamp = Date.now()
    const lastEvent = this.queue?.[this.queue.length - 1]
    if (lastEvent?.timestamp >= timestamp) {
      timestamp = lastEvent.timestamp + 1
    }

    const parentRunId = data.parentRunId ?? this.ctx?.runId.tryUse()
    const user = this.ctx?.user?.tryUse()

    const userId = data.userId ?? user?.userId
    let userProps = data.userProps ?? user?.userProps

    if (userProps && !userId) {
      console.warn(
        "Lunary: userProps passed without userId. Ignoring userProps."
      )
      userProps = undefined
    }

    const runtime = data.runtime ?? this.runtime

    const eventData: Event = {
      event,
      type,
      userId,
      userProps,
      parentRunId,
      timestamp,
      runtime,
      ...cleanExtra(data),
    }

    if (this.verbose) {
      console.log(formatLog(eventData))
    }

    this.queue.push(eventData)

    if (this.queue.length > MAX_CHUNK_SIZE) {
      this.processQueue()
    } else {
      this.debouncedProcessQueue()
    }
  }

  // Wait 500ms to allow other events to be added to the queue
  private debouncedProcessQueue = debounce(() => this.processQueue())

  async processQueue() {
    if (!this.queue.length || this.queueRunning) return

    this.queueRunning = true

    try {
      if (this.verbose)
        console.log(`Lunary: Sending events now to ${this.apiUrl}`)

      const copy = this.queue.slice()

      await fetch(`${this.apiUrl}/v1/runs/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (this.privateKey || this.publicKey),
        },
        body: JSON.stringify({ events: copy }),
      })

      if (this.verbose) console.log("Lunary: Events sent")

      // Clear the events we just sent (don't clear it all in case new events were added while sending)
      this.queue = this.queue.slice(copy.length)

      this.queueRunning = false

      // If there are new events in the queue
      if (this.queue.length) this.processQueue()
    } catch (error) {
      this.queueRunning = false
      console.error("Error sending event(s) to Lunary", error)
    }
  }

  /**
   * Get a dataset's runs from the API.
   * @param {string} datasetSlug - The slug of the dataset to get.
   * @returns {Promise<Run[]>} The dataset's runs.
   */
  getDataset = async (datasetId: string) => {
    try {
      const response = await fetch(`${this.apiUrl}/v1/datasets/${datasetId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (this.privateKey || this.publicKey),
        },
      })

      const data = await response.json()

      return data.runs
    } catch (e) {
      throw new Error(
        `Lunary: Error fetching dataset: you must be on the Unlimited or Enterprise plan to use this feature.`
      )
    }
  }

  /**
   * Get a raw template's data from the API.
   * @param {string} slug - The slug of the template to get.
   * @returns {Promise<RawTemplate>} The template data.
   * @example
   * const template = await lunary.getRawTemplate("welcome")
   * console.log(template)
   */
  getRawTemplate = async (slug: string) => {
    const cacheEntry = this.templateCache[slug]
    const now = Date.now()

    if (cacheEntry && now - cacheEntry.timestamp < 60000) {
      return cacheEntry.data
    }

    const response = await fetch(
      `${this.apiUrl}/v1/template_versions/latest?slug=${slug}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (this.privateKey || this.publicKey),
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Lunary: Error fetching template: ${
          response.statusText || response.status
        } - ${await response.text()}`
      )
    }

    const data = await response.json()
    this.templateCache[slug] = { timestamp: now, data }
    return data
  }

  /**
   * Render a template with the given data in the OpenAI completion format.
   * @param {string} slug - The slug of the template to render.
   * @param {any} data - The data to pass to the template.
   * @returns {Promise<Template>} The rendered template.
   * @example
   * const template = await lunary.renderTemplate("welcome", { name: "John" })
   * console.log(template)
   */
  renderTemplate = async (slug: string, data?: any): Promise<Template> => {
    const { id: templateId, content, extra } = await this.getRawTemplate(slug)

    const textMode = typeof content === "string"

    try {
      const rendered = textMode
        ? compileTemplate(content, data)
        : content.map((t) => ({
            ...t,
            content: compileTemplate(t.content, data),
          }))

      return {
        ...extra,
        [textMode ? "prompt" : "messages"]: rendered,
        templateId,
      }
    } catch (error) {
      throw new Error(`Error rendering template ${slug} - ` + error.message)
    }
  }

  /**
   * Attach feedback to a message or run directly.
   * @param {string} runId - The ID of the message or the run.
   * @param {cJSON} feedback - The feedback to attach.
   * @example
   * monitor.trackFeedback("some-id", { thumbs: "up" });
   **/
  trackFeedback = (runId: string, feedback: cJSON, overwrite = false) => {
    if (!runId || typeof runId !== "string")
      return console.error("Lunary: No message ID provided to track feedback")

    if (typeof feedback !== "object")
      return console.error(
        "Lunary: Invalid feedback provided. Pass a valid object"
      )

    this.trackEvent(null, "feedback", {
      runId,
      overwrite,
      feedback,
    })
  }

  /**
   * Get feedback for a message or run.
   * @param {string} runId - The ID of the message or the run.
   */
  getFeedback = async (runId: string) => {
    if (!runId || typeof runId !== "string")
      return console.error("Lunary: No message ID provided to get feedback")

    const response = await fetch(`${this.apiUrl}/v1/runs/${runId}/feedback`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (this.privateKey || this.publicKey),
      },
    })

    if (!response.ok) {
      throw new Error(
        `Lunary: Error fetching feedback: ${
          response.statusText || response.status
        } - ${await response.text()}`
      )
    }

    const data = await response.json()

    return data
  }

  /**
   * @deprecated Use openThread() instead
   */
  startChat(id?: string) {
    return new Thread(this, { id })
  }

  /**
   * @deprecated Use openThread() instead
   */
  startThread(id?: string) {
    return new Thread(this, { id })
  }

  /**
   * @deprecated Use openThread() instead
   */
  resumeThread(id: string) {
    return new Thread(this, { id, started: true })
  }

  openThread(
    params?:
      | string
      | { id?: string; tags?: string[]; userId?: string; userProps?: cJSON }
  ) {
    return new Thread(
      this,
      typeof params === "string" ? { id: params } : params
    )
  }

  /**
   * Use this to log any external action or tool you use.
   * @param {string} message - Log message
   * @param {any} extra - Extra data to pass
   * @example
   * monitor.info("Running tool Google Search")
   **/
  info(message: string, extra?: any) {
    this.trackEvent("log", "info", {
      message,
      extra,
    })
  }

  log(message: string, extra?: any) {
    this.info(message, extra)
  }

  /**
   * Use this to warn
   * @param {string} message - Warning message
   * @param {any} extra - Extra data to pass
   * @example
   * monitor.log("Running tool Google Search")
   **/
  warn(message: string, extra?: any) {
    this.trackEvent("log", "warn", {
      message,
      extra,
    })
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
  error(message: string | any, error?: any) {
    // Allow error obj to be the first argument
    if (typeof message === "object") {
      error = message
      message = error.message ?? undefined
    }

    this.trackEvent("log", "error", {
      message,
      extra: cleanError(error),
    })
  }

  /**
   * Make sure the queue is flushed before exiting the program
   */
  async flush() {
    if (!this.queueRunning) {
      return await this.processQueue()
    }

    // Wait for a maximum of 10 seconds to send the already running queue
    let counter = 0
    while (this.queueRunning) {
      sleep(100)
      counter++

      if (counter === 10) {
        break
      }
    }
  }
}

export default Lunary
