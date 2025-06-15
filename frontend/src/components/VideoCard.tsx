"use client";
import * as React from "react";

interface VideoCardProps {
  id: string | number;
  title: string;
  date: string;
  className?: string;
}

export function VideoCard({ id, title, date, className = "" }: VideoCardProps) {
  const router = require("next/navigation").useRouter();

  const handleClick = () => {
    router.push(`/video/${id}`);
  };

  return (
    <article className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="aspect-[16/10] w-full max-w-[260px] rounded-xl bg-slate-300 flex flex-col justify-center items-center p-2 focus:outline-none"
      >
        <span className="text-lg md:text-xl font-bold text-neutral-900 truncate w-full text-center">
          {title}
        </span>
        <span className="text-sm md:text-base text-black">
          {date}
        </span>
      </button>
    </article>
  );
}
