"use client";
import React from 'react';
import { VideoThumbnail } from './VideoThumbnail';
import { TranscriptionSection } from '@/components/TranscriptionSection';

type ResultResponse = {
  minutes_id: string;
  title: string;
  video_url: string;
  transcript: { transcript_id: string; transcript_content: string }[];
};

export const VideoSidebar: React.FC<{ resultInfo?: ResultResponse }> = ({ resultInfo }) => {
  return (
    <aside className="flex flex-col w-80 h-full max-md:w-[280px] max-sm:w-full max-sm:h-auto overflow-hidden">
      {/* 固定ヘッダー部分 */}
      <div className="flex-shrink-0">
        <h2 className="px-4 pt-5 pb-2 w-full text-2xl font-bold leading-8 text-neutral-900 max-md:text-2xl max-sm:px-3 max-sm:pt-4 max-sm:pb-2 max-sm:text-xl">
          アップロードした動画
        </h2>

        <section className="flex flex-wrap gap-4 items-end px-4 py-3 w-full max-sm:p-3">
          <div className="flex flex-col flex-1 items-start min-w-40">
            <h3 className="pb-2 w-full text-base font-bold leading-6 text-neutral-900 max-sm:text-sm">
              {resultInfo?.title}
            </h3>
            {resultInfo?.video_url && (
              <video
                src={resultInfo?.video_url}
                controls
                style={{ width: '100%', maxHeight: 240, marginTop: 8 }}
              >
                お使いのブラウザは video タグをサポートしていません。
              </video>
            )}
          </div>
        </section>

        {/* Video Thumbnail Section */}
        {/* <VideoThumbnail /> */}

      </div>

      {/* スクロール可能な文字起こしセクション */}
      <TranscriptionSection transcript={resultInfo?.transcript} />
      
      <div className="flex items-start px-4 py-3 w-full h-16 max-sm:p-3 max-sm:h-auto flex-shrink-0" />
    </aside>
  );
};