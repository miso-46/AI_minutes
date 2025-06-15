"use client";
import Link from "next/link";
import * as React from "react";
import LogoutButton from './LogoutButton';

export function Header() {
  return (
    <header className="flex justify-between items-center px-10 py-3 w-full border border-gray-200 max-md:px-6 max-md:py-3 max-sm:px-4 max-sm:py-3">
      <div className="flex gap-4 items-center">
        <Link href="/" className="text-lg font-bold leading-6 text-neutral-900 max-md:text-base max-sm:text-sm hover:underline">
          Video Insights
        </Link>
      </div>
      <div className="flex flex-1 gap-8 justify-end items-start">
        <div className="flex gap-9 items-center h-10 w-[47px]" />
        <LogoutButton />
      </div>
    </header>
  );
}
