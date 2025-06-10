"use client";
import React from 'react';
import { ActionButton } from './ActionButton';

export const MainContent: React.FC = () => {
  const handleSummaryClick = () => {
    // Summary creation logic would go here
  };

  const handleChatClick = () => {
    // Chat start logic would go here
  };

  return (
    <main className="flex flex-col flex-1 items-start h-full max-w-[960px] max-sm:h-auto">
      <section className="w-full">
        <h2 className="px-4 pt-5 pb-3 w-full text-2xl font-bold leading-7 text-neutral-900 max-md:text-xl max-sm:px-3 max-sm:pt-4 max-sm:pb-3 max-sm:text-lg">
          要約
        </h2>

        <div className="flex gap-5 justify-center items-start px-4 py-2 max-sm:px-3 max-sm:py-2">
          <ActionButton onClick={handleSummaryClick}>
            要約作成
          </ActionButton>
        </div>

        <div className="flex flex-col items-start px-4 pt-1 pb-3 w-full h-11 max-sm:px-3 max-sm:pt-1 max-sm:pb-3 max-sm:h-auto">
          <p className="w-full text-base leading-6 text-neutral-900 max-sm:text-sm" />
        </div>
      </section>

      <section className="w-full">
        <h2 className="px-4 pt-5 pb-3 w-full text-2xl font-bold leading-7 text-neutral-900 max-md:text-xl max-sm:px-3 max-sm:pt-4 max-sm:pb-3 max-sm:text-lg">
          チャット
        </h2>

        <div className="flex gap-5 justify-center items-start px-4 py-2 max-sm:px-3 max-sm:py-2">
          <ActionButton onClick={handleChatClick}>
            チャット開始
          </ActionButton>
        </div>
      </section>
    </main>
  );
};
