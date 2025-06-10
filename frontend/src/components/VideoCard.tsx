"use client";
import * as React from "react";

interface VideoCardProps {
  title: string;
  date: string;
  className?: string;
}

export function VideoCard({ title, date, className = "" }: VideoCardProps) {
  return (
    <article className={`flex flex-col items-center ${className}`}>
      <div className="rounded-xl bg-slate-300 h-[156px] w-[238px] max-md:h-[130px] max-md:w-[200px] max-sm:h-[180px] max-sm:w-[280px]" />
      <div className="flex flex-col gap-0.5 justify-center items-start px-1 py-1.5">
        <h3 className="text-2xl font-bold leading-7 text-neutral-900 w-[238px] max-md:text-xl max-md:w-[200px] max-sm:text-lg max-sm:w-[280px]">
          {title}
        </h3>
        <time className="text-base leading-7 text-center text-black max-md:text-sm max-sm:text-sm">
          {date}
        </time>
      </div>
    </article>
  );
}
