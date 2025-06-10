"use client";
import React from 'react';
import { Header } from '@/components/Header';
import { UploadArea } from '@/components/UploadArea';

export default function VideoUploadPage() {
  return (
    <div className="flex flex-col items-start w-full bg-white min-h-[screen]">
      <Header />
      <main className="flex flex-1 justify-center items-center w-full">
        <UploadArea />
      </main>
    </div>
  );
};

