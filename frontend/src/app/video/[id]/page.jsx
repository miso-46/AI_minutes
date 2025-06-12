import React from 'react';
import { Header } from '@/components/Header';
import { VideoSidebar } from '@/components/VideoSidebar';
import { MainContent } from '@/components/MainContent';

function VideoPage() {
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

export default VideoPage;