import lunary from './index.cjs';
import { LunaryOptions } from './types.cjs';
import { BaseRun, RunUpdate as RunUpdate$1, KVMap } from 'langsmith/schemas';
import { BaseMessage } from '@langchain/core/messages';
import { ChainValues } from '@langchain/core/utils/types';
import { LLMResult } from '@langchain/core/outputs';
import { BaseCallbackHandlerInput, BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { Serialized } from '@langchain/core/load/serializable';
import './lunary-vM5p-WW-.js';

interface Run extends BaseRun {
    id: string;
    child_runs: this[];
    child_execution_order: number;
}
interface RunUpdate extends RunUpdate$1 {
    events: BaseRun["events"];
}
interface LunaryHandlerFields extends BaseCallbackHandlerInput, LunaryOptions {
}
declare class LunaryHandler extends BaseCallbackHandler implements LunaryHandlerFields {
    name: string;
    lunary: typeof lunary;
    constructor(fields?: LunaryHandlerFields);
    handleLLMStart(llm: Serialized, prompts: string[], runId: string, parentRunId?: string, extraParams?: KVMap, tags?: string[], metadata?: KVMap): Promise<void>;
    handleChatModelStart(llm: Serialized, messages: BaseMessage[][], runId: string, parentRunId?: string, extraParams?: KVMap, tags?: string[], metadata?: KVMap): Promise<void>;
    handleLLMEnd(output: LLMResult, runId: string): Promise<void>;
    handleLLMError(error: Error, runId: string): Promise<void>;
    handleChainStart(chain: Serialized, inputs: ChainValues, runId: string, parentRunId?: string, tags?: string[], metadata?: KVMap): Promise<void>;
    handleChainEnd(outputs: ChainValues, runId: string): Promise<void>;
    handleChainError(error: Error, runId: string): Promise<void>;
    handleRetrieverStart(retriever: Serialized, query: string, runId: string, parentRunId?: string, tags?: string[], metadata?: KVMap, name?: string): Promise<void>;
    handleRetrieverEnd(documents: any[], runId: string, parentRunId?: string, tags?: string[]): Promise<void>;
    handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string, tags?: string[], metadata?: KVMap): Promise<void>;
    handleToolEnd(output: string, runId: string): Promise<void>;
    handleToolError(error: Error, runId: string): Promise<void>;
}
declare function getLangChainTemplate(slug: string): Promise<PromptTemplate | ChatPromptTemplate>;

export { LunaryHandler, type LunaryHandlerFields, type Run, type RunUpdate, getLangChainTemplate };
