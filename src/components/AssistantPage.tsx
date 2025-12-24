// src/components/AssistantPage.tsx
import { useEffect } from "react";

declare global {
  interface Window {
    watsonAssistantChatOptions?: any;
  }
}

export default function AssistantPage() {
  useEffect(() => {
    window.watsonAssistantChatOptions = {
      integrationID: "50276422-77bf-4014-9cce-677f24fe189b",
      region: "au-syd",
      serviceInstanceID: "6c218397-7193-4adc-b31a-f6646cc4fe41",
      onLoad: async (instance: any) => {
        await instance.render();     
        try { instance.openWindow(); } catch {}
      },
    };

    const s = document.createElement("script");
    s.src =
      "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
      (window.watsonAssistantChatOptions.clientVersion || "latest") +
      "/WatsonAssistantChatEntry.js";
    document.head.appendChild(s);

    return () => {
      s.remove();
      const bubble = document.querySelector('[id^="WACWidget-"]');
      if (bubble) bubble.remove();
      delete window.watsonAssistantChatOptions;
    };
  }, []);

  return null;
}
