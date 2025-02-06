import { cJSON, LunaryOptions, RunType, EventName, RunEvent, LogEvent, Template } from './types.js';

/**
 * Flow:
 * - const thread = monitor.startThread()
 * - const message = thread.userMessage(string)
 * - message.botAnswer(string)
 * - message.feedback(string)
 */
type Message = {
    id?: string;
    role: "user" | "assistant" | "tool" | "system";
    content?: string | null;
    isRetry?: boolean;
    tags?: string[];
    extra?: cJSON;
    feedback?: cJSON;
};
declare class Thread {
    id: string;
    private monitor;
    private started;
    private tags;
    private userId;
    private userProps;
    constructor(monitor: Lunary, options: {
        id?: string;
        started?: boolean;
        tags?: string[];
        userId?: string;
        userProps?: cJSON;
    });
    /**
     * Track a new message from the user
     *
     * @param {Message} message - The message to track
     * @returns {string} - The message ID, to reconcile with feedback and backend LLM calls
     * */
    trackMessage: (message: Message) => string;
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
    trackUserMessage: (text: string, props?: cJSON, customId?: string) => string;
    /**
     * Track a new message from the bot
     *
     * @deprecated Use trackMessage instead
     *
     * @param {string} replyToId - The message ID to reply to
     * @param {string} text - The bot message
     * @param {cJSON} props - Extra properties to send with the message
     * */
    trackBotMessage: (replyToId: string, text: string, props?: cJSON) => void;
    /**
     * Track a custom event in the thread
     *
     * @param {string} eventName - The name of the event
     * @param {cJSON} [metadata] - Optional metadata associated with the event
     */
    trackEvent: (eventName: string, metadata?: cJSON) => void;
}

declare class Lunary {
    publicKey?: string;
    privateKey?: string;
    verbose?: boolean;
    apiUrl?: string;
    ctx?: any;
    runtime?: string;
    queue: any[];
    private queueRunning;
    private templateCache;
    private didWarnAboutAppId;
    /**
     * @param {LunaryOptions} options
     */
    constructor(ctx?: any);
    init({ appId, publicKey, privateKey, verbose, apiUrl, runtime, }?: LunaryOptions): void;
    /**
     * Manually track a run event.
     * @param {RunType} type - The type of the run.
     * @param {EventName} event - The name of the event.
     * @param {Partial<RunEvent>} data - The data associated with the event.
     * @example
     * monitor.trackEvent("llm", "start", { name: "gpt-4", input: "Hello I'm a bot" });
     */
    trackEvent(type: RunType, event: EventName, data: Partial<RunEvent | LogEvent>): void;
    private debouncedProcessQueue;
    processQueue(): Promise<void>;
    /**
     * Get a dataset's runs from the API.
     * @param {string} datasetSlug - The slug of the dataset to get.
     * @returns {Promise<Run[]>} The dataset's runs.
     */
    getDataset: (datasetId: string) => Promise<any>;
    /**
     * Get a raw template's data from the API.
     * @param {string} slug - The slug of the template to get.
     * @returns {Promise<RawTemplate>} The template data.
     * @example
     * const template = await lunary.getRawTemplate("welcome")
     * console.log(template)
     */
    getRawTemplate: (slug: string) => Promise<any>;
    /**
     * Render a template with the given data in the OpenAI completion format.
     * @param {string} slug - The slug of the template to render.
     * @param {any} data - The data to pass to the template.
     * @returns {Promise<Template>} The rendered template.
     * @example
     * const template = await lunary.renderTemplate("welcome", { name: "John" })
     * console.log(template)
     */
    renderTemplate: (slug: string, data?: any) => Promise<Template>;
    /**
     * Attach feedback to a message or run directly.
     * @param {string} runId - The ID of the message or the run.
     * @param {cJSON} feedback - The feedback to attach.
     * @example
     * monitor.trackFeedback("some-id", { thumbs: "up" });
     **/
    trackFeedback: (runId: string, feedback: cJSON, overwrite?: boolean) => void;
    /**
     * Get feedback for a message or run.
     * @param {string} runId - The ID of the message or the run.
     */
    getFeedback: (runId: string) => Promise<any>;
    /**
     * @deprecated Use openThread() instead
     */
    startChat(id?: string): Thread;
    /**
     * @deprecated Use openThread() instead
     */
    startThread(id?: string): Thread;
    /**
     * @deprecated Use openThread() instead
     */
    resumeThread(id: string): Thread;
    openThread(params?: string | {
        id?: string;
        tags?: string[];
        userId?: string;
        userProps?: cJSON;
    }): Thread;
    /**
     * Use this to log any external action or tool you use.
     * @param {string} message - Log message
     * @param {any} extra - Extra data to pass
     * @example
     * monitor.info("Running tool Google Search")
     **/
    info(message: string, extra?: any): void;
    log(message: string, extra?: any): void;
    /**
     * Use this to warn
     * @param {string} message - Warning message
     * @param {any} extra - Extra data to pass
     * @example
     * monitor.log("Running tool Google Search")
     **/
    warn(message: string, extra?: any): void;
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
    error(message: string | any, error?: any): void;
    /**
     * Make sure the queue is flushed before exiting the program
     */
    flush(): Promise<void>;
}

export { Lunary as L, Thread as T };
