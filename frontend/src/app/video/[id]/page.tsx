'use client';

import React, {useEffect, useState} from 'react';
import useSWR from 'swr';
import { Header } from '@/components/Header';
import { VideoSidebar } from '@/components/VideoSidebar';
import { MainContent } from '@/components/MainContent';
import { useParams } from 'next/navigation';
import { useMinutes } from "@/contexts/MinutesContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatusResponse = {
  minutes_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed'; // 例
  progress: number; // 0-100
};

type ResultResponse = {
  minutes_id: number;
  title: string;
  video_url: string;
  transcript: { transcript_id: number; transcript_content: string }[];
};

export default function VideoPage() {
  const { id } = useParams() as { id: string };
  const { setMinutes } = useMinutes();
  const { minutes } = useMinutes();
  /* 1) ステータス監視 3 秒おき。completed / failed で自動停止 */
  const {
    data: statusInfo,
    error: statusErr,
  } = useSWR<StatusResponse>(
    !minutes?.is_transcripted ? `/api/uploadVideo/status/${id}` : null, // ← ここで制御
    fetcher,
    {
      refreshInterval: (data) =>
        !data || data.status === 'processing' || data.status === 'queued'
          ? 3000
          : 0,
    }
  );
  
  const { data: resultInfo, error: resultErr, isLoading } = useSWR<ResultResponse>(
    !minutes?.is_transcripted && statusInfo?.status === 'completed'
      ? `/api/uploadVideo/result/${id}`
      : null, // ← ここで制御
    fetcher,
  );

  const footerMsg = statusErr
    ? 'ステータス取得に失敗しました'
    : statusInfo?.status === 'failed'
    ? '処理に失敗しました'
    : statusInfo
    ? `${statusInfo.status} – ${statusInfo.progress}%`
    : '取得中...';

  useEffect(() => {
    if (resultInfo) {
      setMinutes({
        minutes_id: resultInfo.minutes_id,
        title: resultInfo.title,
        video_url: resultInfo.video_url,
        transcript_id: resultInfo.transcript[0].transcript_id,
        transcription: resultInfo.transcript[0].transcript_content,
        is_transcripted: true,
        is_summarized: false,
        summary: "",
        is_embedded: false,
        session_id: null,
        is_chatting: false,
        messages: [],
      });
    }
  }, [resultInfo, setMinutes]);

  const transcript_id = resultInfo?.transcript?.[0]?.transcript_id ?? '';
  const minutes_id = resultInfo?.minutes_id ?? '';

  return (

    <div className="flex flex-col w-full bg-white h-screen overflow-hidden">
      <div className="flex flex-col w-full bg-slate-50 h-full overflow-hidden">
        <Header />

        <div className="flex gap-1 justify-center px-6 py-5 w-full flex-1 min-h-0 max-md:px-4 max-md:py-5 max-sm:flex-col max-sm:px-3 max-sm:py-4">
          <VideoSidebar />
          <MainContent />

        </div>
      </div>
    </div>

  );
}
