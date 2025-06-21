'use client';

import React, {useEffect, useState} from 'react';
import useSWR from 'swr';
import { Header } from '@/components/Header';
import { VideoSidebar } from '@/components/VideoSidebar';
import { MainContent } from '@/components/MainContent';
import { ProgressBar } from '@/components/ProgressBar';
import { useParams } from 'next/navigation';
import { useMinutes } from "@/contexts/MinutesContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatusResponse = {
  minutes_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log("VideoPage minutes: ", minutes);

  /* 1) ステータス監視 3秒おき。completed / failed で自動停止 */
  const {
    data: statusInfo,
    error: statusErr,
  } = useSWR<StatusResponse>(
    `/api/uploadVideo/status/${id}`,
    fetcher,
    {
      refreshInterval: (data) =>
        !data || data.status === 'processing' || data.status === 'queued'
          ? 3000
          : 0,
      onSuccess: (data) => {
        console.log(`[${new Date().toLocaleTimeString()}] Polling status:`, data);
      },
    }
  );
  
  const { data: resultInfo, error: resultErr, isLoading } = useSWR<ResultResponse>(
    statusInfo?.status === 'completed'
      ? `/api/uploadVideo/result/${id}`
      : null,
    fetcher,
  );

  // 処理状態の管理
  useEffect(() => {
    if (statusInfo) {
      if (statusInfo.status === 'queued' || statusInfo.status === 'processing') {
        setIsProcessing(true);
      } else if (statusInfo.status === 'completed' || statusInfo.status === 'failed') {
        setIsProcessing(false);
      }
    }
  }, [statusInfo]);

  // 結果データの処理
  useEffect(() => {
    if (resultInfo && !minutes.transcript_id) {
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
      console.log("VideoPage useEffect - resultInfo processed");
    }
  }, [resultInfo, setMinutes]);

  // 既存の議事録データ取得
  useEffect(() => {
    const fetchMinutes = async () => {
      const res = await fetch(`/api/history/getMinutesList/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMinutes(prev => ({
          ...prev,
          minutes_id: Number(id),
          title: data.title,
          video_url: data.video_url,
          transcript_id: data.transcript_id,
          is_transcripted: !!data.transcript_id,
          transcription: data.transcript_content,
          summary: data.summary,
          is_summarized: !!data.summary,
          session_id: data.session_id,
          messages: data.messages,
          is_chatting: !!data.session_id,
          is_embedded: false,
        }));
      }
    };
    // 処理中でなく、文字起こしデータもまだない場合にのみ取得
    if (statusInfo && statusInfo.status !== 'processing' && statusInfo.status !== 'queued' && !minutes.is_transcripted) {
      fetchMinutes(); 
    }
  }, [id, setMinutes, statusInfo, minutes.is_transcripted]);

  // エラーハンドリング
  if (statusErr) {
    return (
      <div className="flex flex-col w-full bg-white h-screen overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600">
              ステータス取得に失敗しました
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 処理中の場合はプログレスバーを表示
  if (isProcessing && statusInfo) {
    return (
      <ProgressBar 
        progress={statusInfo.progress} 
        status={statusInfo.status} 
      />
    );
  }

  // 処理失敗の場合
  if (statusInfo?.status === 'failed') {
    return (
      <div className="flex flex-col w-full bg-white h-screen overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              処理に失敗しました
            </h2>
            <p className="text-gray-600">
              動画の処理中にエラーが発生しました。再度アップロードしてください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 通常の表示（処理完了後または既存データ）
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
