import Link from "next/link";

import { WEEKDAY_LABELS, formatMonth, monthGrid, todayISO } from "@/lib/date";

/** 記録が1件もないときのホーム。カレンダーは薄く見せて「ここに溜まる」ことだけ伝える */
export function EmptyHome({ month }: { month: string }) {
  const cells = monthGrid(month);
  const today = todayISO();

  const numberClass = (dow: number, isToday: boolean) => {
    if (isToday) return "bg-slate-900 font-bold text-white";
    if (dow === 0) return "text-red-300";
    if (dow === 6) return "text-blue-300";
    return "text-slate-300";
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mx-1 mb-3 text-[17px] font-bold tracking-tight">
          {formatMonth(month)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, dow) => (
            <span
              key={label}
              className={`pt-0.5 pb-1 text-center text-[11px] font-semibold ${
                dow === 0
                  ? "text-red-400"
                  : dow === 6
                    ? "text-blue-400"
                    : "text-slate-400"
              }`}
            >
              {label}
            </span>
          ))}
          {cells.map((c) => (
            <div
              key={c.iso}
              className={`h-10 rounded-[10px] bg-slate-50 p-1.5 lg:h-15 ${c.inMonth ? "" : "opacity-30"}`}
            >
              <span
                className={`flex size-5.5 items-center justify-center rounded-full text-xs ${numberClass(c.dow, c.iso === today)}`}
              >
                {c.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center lg:items-start lg:text-left">
        <span className="text-[17px] font-bold">最初の記録をつけよう</span>
        <span className="text-[13px] leading-7 text-slate-600">
          誰と・何を遊んだかを選ぶだけ。
        </span>
        <Link
          href="/sessions/new"
          className="hidden rounded-lg bg-slate-900 px-[18px] py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 lg:inline-block"
        >
          ＋ 今日の記録をつける
        </Link>
      </div>

      <Link
        href="/sessions/new"
        className="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-4 z-30 rounded-xl bg-slate-900 py-[15px] text-center text-base font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,.25)] lg:hidden"
      >
        ＋ 今日の記録をつける
      </Link>
    </div>
  );
}
