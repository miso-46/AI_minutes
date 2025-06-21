"use client";
import React, { useRef, useState } from 'react';
import { UploadIcon } from './UploadIcon';
import { useRouter } from 'next/navigation';
import { useMinutes } from '@/contexts/MinutesContext';

export const UploadArea: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const {resetMinutes} = useMinutes();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 200MBチェック
    if (file.size > 200 * 1024 * 1024) {
      alert('200MB以下の動画ファイルを選択してください。');
      e.target.value = "";
      return;
    }

    // 拡張子チェック
    const allowedExt = ['mp4', 'mov'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedExt.includes(fileExt)) {
      alert('mp4またはmov形式の動画ファイルを選択してください。');
      e.target.value = "";
      return;
    }

    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    const res = await fetch('/api/uploadVideo', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      resetMinutes();
      const data = await res.json();
      if (data.status === 'queued') {
        const id = data.minutes_id
        router.push(`/video/${id}`);
      } else {
        alert('アップロードに失敗しました');
      }
    } else {
      alert('アップロードに失敗しました');
    }
    setUploading(false);
  };

  return (
    <section className="flex gap-1 justify-center items-start px-6 py-5 w-full h-[735px] max-sm:px-4 max-sm:h-auto max-sm:min-h-[600px]">
      <div className="flex flex-col flex-1 justify-center items-center h-[695px] max-w-[960px] max-sm:h-auto">
        <div className="flex flex-col items-center px-4 w-full">
          <div>
            <UploadIcon className="w-[74px] h-[74px] mb-[20px] max-sm:w-[60px] max-sm:h-[60px]" />
          </div>
        </div>
        {!uploadedFile ? (
          <div className="flex flex-col items-center">
            <h2 className="px-4 py-5 text-2xl font-bold leading-7 text-center text-neutral-900 max-sm:px-3 max-sm:py-4 max-sm:w-full max-sm:text-lg max-sm:leading-6">
              動画をアップロードしてください
            </h2>
            <p className="px-4 mb-5 text-lg text-center text-gray-500 max-sm:text-base">
              対応形式：mp4 / mov（200MB以内）
            </p>
          </div>
        ) : (
          <div className="px-4 py-5 text-lg font-medium text-center text-neutral-900">
            {uploadedFile.name}
          </div>
        )}
        <button
          type="button"
          className="gap-2.5 px-5 py-2 text-2xl font-bold leading-7 text-center text-white bg-sky-500 rounded-3xl duration-200 cursor-pointer max-sm:px-4 max-sm:py-2.5 max-sm:text-lg max-sm:leading-6"
          onClick={uploadedFile ? handleUpload : handleButtonClick}
        >
          {uploadedFile ? "アップロード" : "選択"}
        </button>
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
};