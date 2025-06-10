"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export function CreateButton() {
  const router = useRouter();

  return (
    <section className="flex gap-5 justify-center items-start px-0 py-5 max-sm:px-0 max-sm:py-4">
      <button
        className="gap-2.5 px-5 py-2 text-2xl font-bold leading-7 text-center text-white bg-sky-500 rounded-3xl max-md:text-xl max-sm:px-4 max-sm:py-1.5 max-sm:text-lg hover:bg-sky-600 transition-colors"
        onClick={() => router.push("/upload")}
      >
        + 新規作成
      </button>
    </section>
  );
}