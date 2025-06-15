"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 型定義
export type ChatMessage = {
  message_id:number;
  role: "assistant" | "user";
  message: string;
  created_at: string;
};

export type Minutes = {
  minutes_id: number;
  title:string;
  video_url: string;
  transcript_id: number;
  is_transcripted: boolean;
  transcription: string;
  is_summarized: boolean;
  summary: string;
  is_embedded: boolean;
  session_id: number;
  is_chatting: boolean;
  messages: ChatMessage[];
};

// Context型
type MinutesContextType = {
    minutes: Minutes | null;
    setMinutes: React.Dispatch<React.SetStateAction<Minutes | null>>;
    setMinutesId: (id: number) => void;
    setVideoUrl: (url: string) => void;
    setIsTranscripted: (v: boolean) => void;
    setTranscription: (t: string) => void;
    setIsSummarized: (v: boolean) => void;
    setSummary: (s: string) => void;
    setIsEmbedded: (v: boolean) => void;
    setIsChatting: (v: boolean) => void;
    setSessionId: (id: number) => void;
    setMessages: (msgs: ChatMessage[]) => void;
    addMessage: (msg: ChatMessage) => void;
    resetMinutes: () => void;
  };

  // 初期値を定義
const initialMinutes: Minutes = {
    minutes_id: 0,
    title: "",
    video_url: "",
    transcript_id: 0,
    is_transcripted: false,
    transcription: "",
    is_summarized: false,
    summary: "",
    is_embedded: false,
    session_id: 0,
    is_chatting: false,
    messages: [],
  };
// Context作成

const MinutesContext = createContext<MinutesContextType | undefined>(undefined);

// Provider
export const MinutesProvider = ({ children }: { children: ReactNode }) => {
    // localStorageから初期値を取得
    const [minutes, setMinutes] = useState<Minutes>(initialMinutes);

    // useEffect(() => {
    //   if (typeof window !== "undefined") {
    //     const stored = localStorage.getItem("minutes");
    //     if (stored) {
    //       setMinutes(JSON.parse(stored));
    //     }
    //   }
    // }, []);
  // 初期化関数
  const resetMinutes = () => setMinutes(initialMinutes);
  // 個別setter
  const setMinutesId = (id: number) =>
    setMinutes((prev) => prev ? { ...prev, minutes_id: id } : prev);
  const setVideoUrl = (url: string) =>
    setMinutes((prev) => prev ? { ...prev, video_url: url } : prev);
  const setIsTranscripted = (v: boolean) =>
    setMinutes((prev) => prev ? { ...prev, is_transcripted: v } : prev);
  const setTranscription = (t: string) =>
    setMinutes((prev) => prev ? { ...prev, transcription: t } : prev);
  const setIsSummarized = (v: boolean) =>
    setMinutes((prev) => prev ? { ...prev, is_summarized: v } : prev);
  const setSummary = (s: string) =>
    setMinutes((prev) => prev ? { ...prev, summary: s } : prev);
  const setIsEmbedded = (v: boolean) =>
    setMinutes((prev) => prev ? { ...prev, is_embedded: v } : prev);
  const setIsChatting = (v: boolean) =>
    setMinutes((prev) => prev ? { ...prev, is_chatting: v } : prev);
  const setSessionId = (id: number) =>
    setMinutes((prev) => prev ? { ...prev, session_id: id } : prev);
  const setMessages = (msgs: ChatMessage[]) =>
    setMinutes((prev) => prev ? { ...prev, messages: msgs } : prev);
  const addMessage = (msg: ChatMessage) =>
    setMinutes((prev) =>
      prev
        ? { ...prev, messages: [...(prev.messages || []), msg] }
        : prev
    );

    return (
        <MinutesContext.Provider
          value={{
            minutes,
            setMinutes,
            setMinutesId,
            setVideoUrl,
            setIsTranscripted,
            setTranscription,
            setIsSummarized,
            setSummary,
            setIsEmbedded,
            setIsChatting,
            setSessionId,
            setMessages,
            addMessage,
            resetMinutes,
          }}
        >
          {children}
        </MinutesContext.Provider>
      );
};

// カスタムフック
export const useMinutes = () => {
  const context = useContext(MinutesContext);
  if (!context) {
    throw new Error("useMinutes must be used within a MinutesProvider");
  }
  return context;
};