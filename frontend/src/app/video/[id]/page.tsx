'use client';

import React, {useEffect, useState} from 'react';
import useSWR from 'swr';
import { Header } from '@/components/Header';
import { VideoSidebar } from '@/components/VideoSidebar';
import { MainContent } from '@/components/MainContent';
import { useParams } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatusResponse = {
  minutes_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed'; // 例
  progress: number; // 0-100
};

type ResultResponse = {
  minutes_id: string;
  title: string;
  video_url: string;
  transcript: { transcript_id: string; transcript_content: string }[];
};

export default function VideoPage() {
  const { id } = useParams() as { id: string };

  /* 1) ステータス監視 3 秒おき。completed / failed で自動停止 */
  const {
    data: statusInfo,
    error: statusErr,
  } = useSWR<StatusResponse>(`/api/uploadVideo/status/${id}`, fetcher, {
    refreshInterval: (data) =>
      !data || data.status === 'processing' || data.status === 'queued'
        ? 3000
        : 0,
  });

  /* 2) 完了したら結果を 1 度だけ取得 */
  const { data: resultInfo, error: resultErr, isLoading } = useSWR<ResultResponse>(
    statusInfo?.status === 'completed' ? `/api/uploadVideo/result/${id}` : null,
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
    console.log("footerMsg: ",footerMsg);
    console.log("resultInfo: ",resultInfo);
  }, [resultInfo]);

  const transcript_id = resultInfo?.transcript?.[0]?.transcript_id ?? '';

  return (
    <div className="flex flex-col w-full bg-white h-screen overflow-hidden">
      <div className="flex flex-col w-full bg-slate-50 h-full overflow-hidden">
        <Header />

        <div className="flex gap-1 justify-center px-6 py-5 w-full flex-1 min-h-0 max-md:px-4 max-md:py-5 max-sm:flex-col max-sm:px-3 max-sm:py-4">
          <VideoSidebar resultInfo={resultInfo}/>

          {/* MainContent に minutesId と取得結果を渡す */}
          <MainContent transcript_id={transcript_id} isLoading={isLoading} />

        </div>
      </div>
    </div>
  );
}
