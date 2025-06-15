"use client";
import React, { useState }  from 'react';
import { ActionButton } from './ActionButton';
import ReactMarkdown from 'react-markdown';
import { ChatInterface } from './ChatInterface';
import { useMinutes } from "@/contexts/MinutesContext";

export const MainContent: React.FC = () => {
  const { minutes, setSummary, setSessionId, setIsSummarized } = useMinutes();
  const [loading, setLoading] = useState(false);


  const handleSummaryClick = async () => {
    setLoading(true);
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
    <main className="relative flex flex-col w-full max-w-[800px] mx-auto h-[calc(100vh-120px)] max-h-[calc(100vh-120px)]">
      <section className="w-full">
        <h2 className="px-4 pt-5 pb-3 w-full text-2xl font-bold leading-7 text-neutral-900 max-md:text-xl max-sm:px-3 max-sm:pt-4 max-sm:pb-3 max-sm:text-lg">
          要約
        </h2>

        <div className="flex gap-5 justify-center items-start px-4 py-2 max-sm:px-3 max-sm:py-2">
          { !minutes.is_transcripted ? (
              <div>文字起こしデータ取得中...</div>
            ) : minutes.is_summarized ? (
              <div className="p-4 bg-gray-100 rounded w-full overflow-y-auto max-h-[320px]">
                <ReactMarkdown>{minutes.summary}</ReactMarkdown>
              </div>
            ) : (
              <ActionButton onClick={handleSummaryClick} disabled={loading}>
                {loading ? "作成中..." : "要約作成"}
              </ActionButton>
            )
          }
                      
        </div>

        <div className="flex flex-col items-start px-4 pt-1 pb-3 w-full h-11 max-sm:px-3 max-sm:pt-1 max-sm:pb-3 max-sm:h-auto">
          <p className="w-full text-base leading-6 text-neutral-900 max-sm:text-sm" />
        </div>
      </section>

      <section className="flex-1 flex flex-col w-full">
        <h2 className="px-4 pt-5 pb-3 w-full text-2xl font-bold leading-7 text-neutral-900 max-md:text-xl max-sm:px-3 max-sm:pt-4 max-sm:pb-3 max-sm:text-lg">
          チャット
        </h2>

        <div className="flex gap-5 justify-center items-start px-4 py-2 max-sm:px-3 max-sm:py-2">
          {!minutes.is_transcripted ? (
            <div>文字起こしデータ取得中...</div>
          ) : minutes.session_id ? (
            <div className="flex-1 flex flex-col w-full">
              <ChatInterface />
            </div>
          ) : (
            <ActionButton onClick={handleChatClick}>
              チャット開始
            </ActionButton>
          )}
        </div>
      </section>
    </main>
  );
};
