import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  const isFailed = status === 'failed';

  return (
    <div className="h-full inset-0 bg-white flex items-center justify-center">
      <div className={`w-full max-w-md px-6 ${isFailed ? 'opacity-50' : ''}`}>
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isFailed ? '処理失敗' : '動画を処理中です...'}
          </h2>
          <p className="text-sm text-gray-600">
            {status === 'queued' && '処理待ちです'}
            {status === 'processing' && '動画を処理しています'}
            {status === 'completed' && '処理完了'}
          </p>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-sky-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-gray-700">
            {progress}%
          </span>
        </div>
      </div>
      {isFailed && (
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center text-red-500 font-semibold">
          <p>動画処理に失敗しました。再度動画をアップロードしてください。</p>
        </div>
      )}
    </div>
  );
}; 