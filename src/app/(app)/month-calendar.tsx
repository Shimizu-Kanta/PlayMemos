"use client";

import { InitialAvatar, personPalette } from "@/components/avatar";
import type { Participant, SessionDetail } from "@/lib/database.types";
import { WEEKDAY_LABELS, monthGrid, type MonthCell } from "@/lib/date";

export type DayBucket = MonthCell & {
  sessions: SessionDetail[];
  /** その日のユニークな参加者（記録の並び順） */
  participants: Participant[];
};

/** 絞り込み後の記録を、月のマス目に振り分ける */
export function buildDays(
  month: string,
  sessions: SessionDetail[],
): DayBucket[] {
  const byDate = new Map<string, SessionDetail[]>();
  for (const s of sessions) {
    const list = byDate.get(s.played_on);
    if (list) list.push(s);
    else byDate.set(s.played_on, [s]);
  }

  return monthGrid(month).map((cell) => {
    const daySessions = byDate.get(cell.iso) ?? [];
    const seen = new Set<string>();
    const participants: Participant[] = [];
    for (const s of daySessions) {
      for (const p of s.participants) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        participants.push(p);
      }
    }
    return { ...cell, sessions: daySessions, participants };
  });
}

const RING_SELECTED = "shadow-[inset_0_0_0_2px_#0f172a]";
const RING_HAS_RECORD = "shadow-[inset_0_0_0_1px_#e2e8f0]";

function weekdayColor(dow: number) {
  if (dow === 0) return "text-red-600";
  if (dow === 6) return "text-blue-600";
  return "text-slate-500";
}

function WeekdayRow() {
  return (
    <>
      {WEEKDAY_LABELS.map((label, dow) => (
        <span
          key={label}
          className={`pt-0.5 pb-1 text-center text-[11px] font-semibold ${weekdayColor(dow)}`}
        >
          {label}
        </span>
      ))}
    </>
  );
}

type Props = {
  month: string;
  days: DayBucket[];
  selectedDate: string | null;
  /** 1人だけで絞り込んでいるとき、その人の名前（色付けに使う） */
  highlightName: string | null;
  onSelect: (iso: string) => void;
};

/** PC 用の月表示 */
export function MonthCalendar({
  days,
  selectedDate,
  highlightName,
  onSelect,
}: Props) {
  const highlight = highlightName ? personPalette(highlightName) : null;

  return (
    <div className="grid grid-cols-7 gap-1">
      <WeekdayRow />

      {days.map((d) => {
        const selected = d.iso === selectedDate;
        const has = d.sessions.length > 0;
        const marked = has && highlight !== null;

        const background = marked
          ? highlight.surface
          : has
            ? "bg-white"
            : d.dow === 0 || d.dow === 6
              ? "bg-slate-50"
              : "bg-[#fcfcfd]";

        const numberColor = marked
          ? highlight.text
          : d.isToday
            ? "bg-slate-900 font-bold text-white"
            : highlight
              ? "text-slate-400"
              : d.dow === 0
                ? "text-red-600"
                : d.dow === 6
                  ? "text-blue-600"
                  : "text-slate-700";

        return (
          <button
            key={d.iso}
            type="button"
            aria-pressed={selected}
            aria-label={`${d.day}日`}
            onClick={() => onSelect(d.iso)}
            className={[
              "flex min-h-23 min-w-0 cursor-pointer flex-col gap-1 rounded-[10px] p-1.5 text-left transition",
              background,
              selected ? RING_SELECTED : has ? RING_HAS_RECORD : "",
              d.inMonth ? "" : "opacity-35",
            ].join(" ")}
          >
            <span
              className={`flex size-5.5 items-center justify-center rounded-full text-xs ${numberColor} ${d.isToday && !marked ? "" : "font-medium"}`}
            >
              {d.day}
            </span>

            {d.sessions.slice(0, 2).map((s) => (
              <span
                key={s.id}
                className={`truncate rounded-[5px] px-1.5 text-[11px] leading-[18px] ${
                  marked ? `bg-white ${highlight.text}` : "bg-slate-100 text-slate-700"
                }`}
              >
                {s.game_title}
              </span>
            ))}

            {d.sessions.length > 2 ? (
              <span className="pl-1 text-[10px] text-slate-500">
                +{d.sessions.length - 2}
              </span>
            ) : null}

            {d.participants.length > 0 ? (
              <span className="mt-auto flex pl-1.5">
                {d.participants.slice(0, 4).map((p) => (
                  <InitialAvatar
                    key={p.id}
                    name={p.name}
                    className="-ml-1 size-4 text-[9px] ring-[1.5px] ring-white"
                  />
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** スマホ用の月表示（日付とドットだけ） */
export function CompactCalendar({
  days,
  selectedDate,
  highlightName,
  onSelect,
}: Props) {
  const highlight = highlightName ? personPalette(highlightName) : null;

  return (
    <div className="grid grid-cols-7 gap-0.5 rounded-[14px] border border-slate-200 bg-white px-1.5 py-2">
      <WeekdayRow />

      {days.map((d) => {
        const selected = d.iso === selectedDate;
        const has = d.sessions.length > 0;
        const marked = has && highlight !== null;

        const numberStyle = selected
          ? "bg-slate-900 font-bold text-white"
          : marked
            ? `${highlight.surface} font-bold ${highlight.text}`
            : d.isToday
              ? "bg-slate-200 font-bold text-slate-900"
              : highlight
                ? "text-slate-400"
                : d.dow === 0
                  ? "text-red-600"
                  : d.dow === 6
                    ? "text-blue-600"
                    : "text-slate-700";

        return (
          <button
            key={d.iso}
            type="button"
            aria-pressed={selected}
            aria-label={`${d.day}日`}
            onClick={() => onSelect(d.iso)}
            className={[
              "flex h-12.5 cursor-pointer flex-col items-center gap-1 rounded-[10px] pt-1.5",
              selected ? "bg-slate-100" : "",
              d.inMonth ? "" : "opacity-35",
            ].join(" ")}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[13px] ${numberStyle}`}
            >
              {d.day}
            </span>

            <span className="flex h-1.5 gap-0.5">
              {d.participants.slice(0, 4).map((p) => (
                <span
                  key={p.id}
                  className={`size-1.5 rounded-full ${personPalette(p.name).dot}`}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
