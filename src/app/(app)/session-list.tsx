"use client";

import type { SessionDetail } from "@/lib/database.types";
import { parseISODate } from "@/lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function dayColor(dow: number) {
  if (dow === 0) return "text-red-600";
  if (dow === 6) return "text-blue-600";
  return "text-slate-900";
}

type Props = {
  sessions: SessionDetail[];
  selectedDate: string | null;
  /** スマホ側はひとまわり大きい文字にする */
  large?: boolean;
  emptyText: string;
  onSelect: (iso: string) => void;
};

/** 新しい順の記録リスト。同じ日の2件目以降は日付を省く */
export function SessionList({
  sessions,
  selectedDate,
  large = false,
  emptyText,
  onSelect,
}: Props) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {sessions.map((s, index) => {
        const firstOfDay = index === 0 || sessions[index - 1].played_on !== s.played_on;
        const dow = parseISODate(s.played_on).getDay();
        const selected = s.played_on === selectedDate;

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.played_on)}
            className={[
              "grid w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)] items-center gap-3 px-3.5 py-[11px] text-left transition",
              index === 0
                ? ""
                : firstOfDay
                  ? "border-t border-slate-200"
                  : "border-t border-slate-50",
              selected
                ? "bg-slate-100 shadow-[inset_3px_0_0_#0f172a]"
                : "hover:bg-slate-50",
            ].join(" ")}
          >
            <span className="flex flex-col items-center leading-none">
              <span
                className={`font-bold ${large ? "text-[18px]" : "text-[17px]"} ${dayColor(dow)}`}
              >
                {firstOfDay ? parseISODate(s.played_on).getDate() : ""}
              </span>
              {firstOfDay ? (
                <span className="mt-[3px] text-[10px] text-slate-400">
                  {WEEKDAYS[dow]}
                </span>
              ) : null}
            </span>

            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className={`font-semibold ${large ? "text-[15px]" : "text-sm"}`}
              >
                {s.game_title}
              </span>
              <span className="truncate text-xs text-slate-500">
                {s.participants.length > 0
                  ? s.participants.map((p) => p.name).join("、")
                  : "参加者の記録なし"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
