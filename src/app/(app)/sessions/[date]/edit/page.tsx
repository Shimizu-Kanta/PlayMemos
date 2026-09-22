import type { Metadata } from "next";

import { notFound } from "next/navigation";

import {
  getDayRows,
  getGameOptions,
  getPersonOptions,
} from "@/lib/data/sessions";
import { isISODate } from "@/lib/date";

import { DayForm } from "./day-form";

export const metadata: Metadata = {
  title: "記録する",
};

export default async function EditDayPage({
  params,
}: PageProps<"/sessions/[date]/edit">) {
  const { date } = await params;
  if (!isISODate(date)) notFound();

  const [rows, games, people] = await Promise.all([
    getDayRows(date),
    getGameOptions(),
    getPersonOptions(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {rows.length > 0 ? "記録を編集" : "記録する"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          遊んだ順に上から並べます。同じ日に複数のゲームを遊んだら行を追加してください。
        </p>
      </div>

      {/* 日付が変わったらフォームの状態を作り直す */}
      <DayForm
        key={date}
        date={date}
        initialRows={rows}
        games={games}
        people={people}
      />
    </div>
  );
}
