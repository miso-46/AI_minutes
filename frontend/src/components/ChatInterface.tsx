"use client";
import * as React from "react";
import { useMinutes } from "@/contexts/MinutesContext";

export function ChatInterface() {
  const { minutes } = useMinutes();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [minutes.messages]); // メッセージが変わるたびに発火

  return (
    <div className="flex-1 flex flex-col h-full w-full">
      {/* メッセージリストだけスクロール */}
      <div className="flex flex-col w-full overflow-y-auto">
        {minutes.messages?.map((msg, idx) => (
          <div
            key={msg.message_id ?? idx}
            className={`flex gap-3 items-end p-4 w-full text-base max-md:max-w-full ${
              msg.role === "assistant" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`flex flex-col flex-1 shrink items-${
                msg.role === "assistant" ? "start" : "end"
              } w-full basis-0 min-w-60 max-md:max-w-full`}
            >
              <div
                className={`px-4 py-3 rounded-lg max-w-[960px] w-auto inline-block ${
                  msg.role === "assistant"
                    ? "bg-slate-200 text-neutral-900"
                    : "bg-sky-500 text-white"
                }`}
              >
                {msg.message}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} style={{ height: 0, margin: 0, padding: 0 }} /> 
      </div>
    </div>
  );
}