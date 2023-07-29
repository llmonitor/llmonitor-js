import { ChatMessage, Event } from "./types";
export declare const checkEnv: (variable: string) => string | undefined;
export declare const formatLog: (event: Event) => void;
export declare const debounce: (func: any, timeout?: number) => (...args: any[]) => void;
export declare const cleanError: (error: any) => {
    message: string;
    stack?: undefined;
} | {
    message: any;
    stack: any;
};
export declare const getArgumentNames: (func: Function) => string[];
export declare const getFunctionInput: (func: Function, args: any) => any;
export declare const parseLangchainMessages: (input: any | any[] | any[][]) => ChatMessage | ChatMessage[] | ChatMessage[][];
