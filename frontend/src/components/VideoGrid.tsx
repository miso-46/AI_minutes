"use client";
import * as React from "react";
import { VideoCard } from "./VideoCard";
import { useHistory } from "@/contexts/HistoryContext";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());


export function VideoGrid() {
  const { data, error, isLoading } = useSWR("/api/history", fetcher);
  const { history, setHistory } = useHistory(); // ← ここを上に移動

  // data.minutesが更新されたらhistoryにセット
  React.useEffect(() => {
    if (data && data.minutes) {
      setHistory(data.minutes);
      console.log("Grid",data.minutes);
    }
  }, [data, setHistory]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>エラーが発生しました</div>;
  if (!data || !data.minutes) return <div>データがありません</div>;

  return (
    <section className="w-full px-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 sm:gap-7 md:gap-8">
        {history?.map((item) => (
          <VideoCard
            key={item.minutes_id}
            id={item.minutes_id}
            title={item.title}
            date={item.created_at.substring(0, 10)}
            /* カード側で w-full にしておくと
               各グリッドセルいっぱいに広がります */
            className="w-full"
          />
        ))}
      </div>
    </section>
  );
}
