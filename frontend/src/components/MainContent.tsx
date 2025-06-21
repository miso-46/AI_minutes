"use client";
import React, { useState }  from 'react';
import { ActionButton } from './ActionButton';
import ReactMarkdown from 'react-markdown';
import { ChatInterface } from './ChatInterface';
import { useMinutes } from "@/contexts/MinutesContext";
import remarkGfm from 'remark-gfm';

export const MainContent: React.FC = () => {
  const { minutes, setSummary, setSessionId, setIsSummarized, addMessage } = useMinutes();
  const [loading, setLoading] = useState(false);
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
      setInput("");
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
    setSending(false);
  };

  const handleSummaryClick = async () => {
    setLoading(true);
    console.log("MainContent : ", minutes);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_id: minutes.transcript_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "要約作成に失敗しました");
        setLoading(false);
        return;
      }
      setSummary(data.summary);
      setIsSummarized(true);
      setLoading(false);
    } catch (e) {
      alert("通信エラーが発生しました");
      setLoading(false);
    }
  };

  const handleChatClick = async () => {
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes_id: minutes.minutes_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "チャット開始に失敗しました");
        return;
      }
      setSessionId(data.session_id);
      console.log("Chat started:", data);
    } catch (e) {
      alert("通信エラーが発生しました");
    }
  };

  return (
    <main className="flex flex-col h-screen w-full relative">
       <section className="flex-1 flex flex-col w-full min-h-0 overflow-hidden flex-[0_0_40%]">
        <h2 className="px-4 pt-5 pb-3 w-full text-2xl font-bold leading-7 text-neutral-900 max-md:text-xl max-sm:px-3 max-sm:pt-4 max-sm:pb-3 max-sm:text-lg">
          要約
        </h2>

        <div className="flex-1 min-h-0 flex gap-5 justify-center items-start px-4 py-2 max-sm:px-3 max-sm:py-2">
          { !minutes.is_transcripted ? (
              <div>文字起こしデータ取得中...</div>
            ) : minutes.is_summarized ? (
              <div className="flex-1 flex p-4 bg-gray-100 rounded overflow-y-auto h-full bg-white rounded-lg">
                <div className="prose w-full max-w-none whitespace-normal">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{minutes.summary}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <ActionButton onClick={handleSummaryClick} disabled={loading}>
                {loading ? "作成中..." : "要約作成"}
              </ActionButton>
            )
          }
                      
        </div>
      </section>

      <section className="flex-1 flex flex-col w-full max-sm:h-auto flex-[0_0_45%]">
        <h2 className="px-4 pt-5 pb-3 w-full text-2xl font-bold leading-7 text-neutral-900 max-md:text-xl max-sm:px-3 max-sm:pt-4 max-sm:pb-3 max-sm:text-lg">
          チャット
        </h2>

        <div className="flex-1 flex gap-5 justify-center items-start px-4 py-2 max-sm:px-3 max-sm:py-2">
          {!minutes.is_transcripted ? (
            <div>文字起こしデータ取得中...</div>
          ) : minutes.session_id ? (
            <div className="flex-1 flex flex-col w-full min-h-0 overflow-y-auto max-h-[40vh]">
              <ChatInterface />
            </div>
          ) : (
            <div className="flex justify-center items-center flex-1">
            <ActionButton onClick={handleChatClick}>
              チャット開始
            </ActionButton>
            </div>
          )}
        </div>

      </section>
            {/* 入力欄を一番下に */}
      <div className="w-full border-t border-gray-200 shrink-0 bottom-0 left-0">
          <div className="flex gap-3 items-center px-4 py-2 w-full max-w-[960px] mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about the video..."
            className="flex-1 py-2 pr-2 pl-4 text-base rounded-lg bg-slate-200 text-slate-500 border-none outline-none"
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) return;
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
    </main>
  );
};
