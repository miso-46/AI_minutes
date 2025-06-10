import React from 'react';

export const VideoThumbnail: React.FC = () => {
  return (
    <section className="flex flex-wrap gap-4 items-end px-4 py-3 w-full max-sm:p-3">
    <div className="flex flex-col flex-1 items-start bg-white min-w-40">
      <div className="flex flex-1 items-start p-4 w-full rounded-lg border bg-slate-300 border-slate-300 min-h-36 max-sm:p-3 max-sm:min-h-[120px]" />
    </div>
  </section>
  );
};
