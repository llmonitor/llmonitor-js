import {
  browser_default
} from "./chunk-GL6XN5RS.js";
import "./chunk-AX3726TK.js";
import {
  __name
} from "./chunk-AGSXOS4O.js";

// src/react.ts
import { useEffect, useRef, useState } from "react";
function useChatMonitor() {
  const [thread, setThread] = useState();
  const restart = /* @__PURE__ */ __name(() => {
    const newThread = browser_default.openThread();
    setThread(newThread);
    return newThread;
  }, "restart");
  const resumeThread = /* @__PURE__ */ __name((id) => {
    const newThread = browser_default.openThread(id);
    setThread(newThread);
    return newThread;
  }, "resumeThread");
  useEffect(() => {
    restart();
  }, []);
  return {
    restart,
    // Deprecated TODO: remove
    restartThread: restart,
    resumeThread,
    trackMessage: thread?.trackMessage,
    trackFeedback: browser_default.trackFeedback,
    identify: browser_default.identify
  };
}
__name(useChatMonitor, "useChatMonitor");
var useMonitorVercelAI = /* @__PURE__ */ __name((props) => {
  const { messages, isLoading } = props;
  const {
    trackFeedback,
    trackMessage,
    resumeThread,
    restartThread,
    identify,
    restart
  } = useChatMonitor();
  const previousMessages = useRef(messages);
  useEffect(() => {
    if (previousMessages.current.length < messages.length) {
      const newMessage = messages[messages.length - 1];
      if (newMessage.role === "user") {
        trackMessage({
          role: "user",
          id: newMessage.id,
          content: newMessage.content
        });
      } else if (newMessage.role === "assistant" && // Make sure it's not streaming
      !isLoading) {
        const userMessage = messages[messages.length - 2];
        trackMessage({
          role: "assistant",
          id: userMessage.id,
          content: newMessage.content
        });
      }
    }
  }, [isLoading, messages]);
  return {
    ...props,
    trackFeedback,
    trackMessage,
    resumeThread,
    restartThread,
    identify
  };
}, "useMonitorVercelAI");
var react_default = browser_default;
export {
  react_default as default,
  useChatMonitor,
  useMonitorVercelAI
};
