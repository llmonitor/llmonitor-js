import { WrappableFn, WrappedFn, WrapParams } from './types.js';
import { L as Lunary } from './lunary-D5yxVq16.js';

declare class BackendMonitor extends Lunary {
    private wrap;
    private executeWrappedFunction;
    /**
     * TODO: This is not functional yet
     * Wrap anything to inject user or message ID context.
     * @param {Promise} func - Function to wrap
     **/
    wrapContext<T extends WrappableFn>(func: T): WrappedFn<T>;
    /**
     * Wrap an agent's Promise to track it's input, results and any errors.
     * An agent is a group of tools and llms that work together to achieve a goal.
     * @param {Promise} func - Agent function
     * @param {WrapParams} params - Wrap params
     */
    wrapAgent<T extends WrappableFn>(func: T, params?: WrapParams<T>): WrappedFn<T>;
    /**
     * Wrap an chain's Promise to track it's input, results and any errors.
     * A chain is a grouped sequence of actions (llms, tools and agents).
     * @param {Promise} func - Chain function
     * @param {WrapParams} params - Wrap params
     */
    wrapChain<T extends WrappableFn>(func: T, params?: WrapParams<T>): WrappedFn<T>;
    /**
     * Wrap an tool's Promise to track it's input, results and any errors.
     * @param {Promise} func - Tool function
     * @param {WrapParams} params - Wrap params
     */
    wrapTool<T extends WrappableFn>(func: T, params?: WrapParams<T>): WrappedFn<T>;
    /**
     * Wrap an model's Promise to track it's input, results and any errors.
     * @param {Promise} func - Model generation function
     * @param {WrapParams} params - Wrap params
     */
    wrapModel<T extends WrappableFn>(func: T, params?: WrapParams<T>): WrappedFn<T>;
    /**
     * Scores a run based on the provided label, value, and optional comment
     *
     * @param {string} runId - Unique run identifier
     * @param {string} label - Evaluation label
     * @param {number | string | boolean} value - Evaluation value
     * @param {string} [comment] - Optional evaluation comment
     */
    score(runId: string, label: string, value: number | string | boolean, comment?: string): Promise<void>;
}

declare const lunary: BackendMonitor;

export { BackendMonitor as Monitor, lunary as default };
