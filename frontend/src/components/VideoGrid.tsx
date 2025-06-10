"use client";
import * as React from "react";
import { VideoCard } from "./VideoCard";

export function VideoGrid() {
  const videos = [
    { title: "Tech0講義動画", date: "2025/05/04" },
    { title: "Tech0講義動画", date: "2025/05/04" },
    { title: "Tech0講義動画", date: "2025/05/04" },
    { title: "Tech0講義動画", date: "2025/05/04" },
    { title: "Tech0講義動画", date: "2025/05/04" },
    { title: "Tech0講義動画", date: "2025/05/04" },
  ];

  return (
    <section className="flex flex-col gap-5 items-center max-md:gap-4 max-sm:gap-3">
      <div className="flex gap-5 items-center max-md:gap-4 max-sm:flex-col max-sm:gap-3">
        <VideoCard title={videos[0].title} date={videos[0].date} />
        <VideoCard title={videos[1].title} date={videos[1].date} />
        <VideoCard
          title={videos[2].title}
          date={videos[2].date}
          className="max-sm:hidden"
        />
      </div>
      <div className="flex gap-5 items-center max-md:gap-4 max-sm:flex-col max-sm:gap-3">
        <VideoCard title={videos[3].title} date={videos[3].date} />
        <VideoCard title={videos[4].title} date={videos[4].date} />
        <VideoCard
          title={videos[5].title}
          date={videos[5].date}
          className="max-sm:hidden"
        />
      </div>
    </section>
  );
}
