import * as React from "react";
import { Header } from "@/components/Header";
import { CreateButton } from "@/components/CreateButton";
import { VideoGrid } from "@/components/VideoGrid";
import { requireAuth } from '@/lib/auth'

export default async function Home() {


  return (
    <div className="flex flex-col items-start w-full bg-white min-h-screen">
      <div className="flex flex-col items-start w-full bg-slate-50 min-h-screen">
        <div className="flex flex-col items-start w-full">
          <Header />
          <main className="flex flex-1 gap-1 justify-center items-start px-6 py-5 w-full max-md:px-4 max-md:py-5 max-sm:px-3 max-sm:py-4">
            <div className="flex flex-col flex-1 gap-5 justify-center items-center max-w-[960px] min-h-[695px]">
              <CreateButton />
              <VideoGrid />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
