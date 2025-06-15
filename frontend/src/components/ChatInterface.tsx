"use client";
import * as React from "react";
import { useMinutes } from "@/contexts/MinutesContext";

export function ChatInterface() {
    const { minutes, addMessage } = useMinutes();
    const [input, setInput] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const handleSend = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
    
        // 1. ユーザーメッセージを追加
        addMessage({
          message_id: Date.now(),
          role: "user",
          message: input,
          created_at: new Date().toISOString(),
        });
    
        try {
          // 2. APIに送信
          const res = await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: minutes.session_id,
              message: input,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "送信に失敗しました");
            setSending(false);
            return;
          }
          // 3. アシスタントの返答を追加
          addMessage({
            message_id: data.message_id,
            role: "assistant",
            message: data.message, // ← FastAPIの返答のキー名に合わせてください
            created_at: data.created_at,
          });
        } catch (e) {
          alert("通信エラーが発生しました");
        }
        setInput("");
        setSending(false);
      };

  return (
    <div className="flex flex-col h-full w-full">
      {/* メッセージリストだけスクロール */}
      <div className="flex flex-col w-full overflow-y-auto max-h-[560px]">
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
                className={`px-4 py-3 rounded-lg max-w-[560px] w-auto inline-block ${
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
      </div>
      {/* 入力欄を一番下に */}
      <div className="w-full bg-white border-t border-gray-200 shrink-0">
        <div className="flex gap-3 items-center px-4 py-2 w-full max-w-[960px] mx-auto">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about the video..."
          className="flex-1 py-2 pr-2 pl-4 text-base rounded-lg bg-slate-200 text-slate-500 border-none outline-none"
          onKeyDown={e => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={sending}
        />
        <button
          className="px-4 py-2 bg-sky-500 rounded-lg text-white hover:bg-sky-600 transition-colors min-w-[84px]"
          onClick={handleSend}
          type="button"
          disabled={sending}
        >
          {sending ? "送信中..." : "Send"}
        </button>
      </div>
      </div>
    </div>
  );
}