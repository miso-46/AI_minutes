import React from 'react';

type Props = {transcript?: string;};

export const TranscriptionSection: React.FC<Props> = ({ transcript }) => {
  return (
    <section className="flex flex-col flex-1 px-4 w-full min-h-0 max-sm:px-3">
    <h3 className="pb-2 w-full text-base font-bold leading-6 text-neutral-900 max-sm:text-sm flex-shrink-0">
      文字起こし
    </h3>
    <article className="flex-1 px-4 pt-1 pb-3 w-full text-base leading-6 text-neutral-900 max-sm:px-3 max-sm:pt-1 max-sm:pb-3 max-sm:text-sm overflow-y-auto min-h-0 bg-white rounded border border-gray-200">
      {transcript ? (
            <div>{transcript}</div>          
        ) : (
          <div>文字起こしデータがありません</div>
        )}
    </article>
  </section>
  );
};
