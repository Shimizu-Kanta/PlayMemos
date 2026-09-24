"use client";

import Link from "next/link";

import { InitialAvatar } from "@/components/avatar";
import type { SessionDetail } from "@/lib/database.types";
import {
  formatDateLong,
  formatMonthDay,
  weekdayTextClass,
} from "@/lib/date";

function Tag({ name }: { name: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
      {name}
    </span>
  );
}

function Memo({ text, large }: { text: string; large?: boolean }) {
  return (
    <p
      className={`m-0 rounded-lg bg-slate-50 px-3 py-2 whitespace-pre-wrap text-slate-600 ${large ? "text-sm" : "text-[13px]"}`}
    >
      {text}
    </p>
  );
}

type Props = {
  date: string;
  sessions: SessionDetail[];
  onBack: () => void;
};

/** PC：右カラムをリストから詳細に切り替えたときの表示 */
export function DayDetailPanel({ date, sessions, onBack }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4.5 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-600 transition hover:text-slate-900"
        >
          ← 一覧
        </button>
        <Link
          href={`/sessions/${date}/edit`}
          className="ml-auto rounded-lg border border-slate-200 px-3 py-[5px] text-[13px] text-slate-600 transition hover:bg-slate-50"
        >
          編集
        </Link>
      </div>

      <div className="flex flex-col gap-1 px-5 pt-5 pb-2">
        <span className={`text-[13px] font-semibold ${weekdayTextClass(date)}`}>
          {formatDateLong(date)}
        </span>
        <span className="text-[13px] text-slate-500">
          {sessions.length}件の記録
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="px-5 pt-2 pb-5 text-sm text-slate-500">
          この日の記録はありません。
        </p>
      ) : (
        sessions.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2.5 border-t border-slate-100 px-5 py-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold">{s.game_title}</span>
              {s.tags.map((t) => (
                <Tag key={t} name={t} />
              ))}
            </div>

            {s.participants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {s.participants.map((p) => (
                  <Link
                    key={p.id}
                    href={`/people/${p.id}`}
                    className="flex items-center gap-1.5 text-[13px] text-slate-700 hover:underline"
                  >
                    <InitialAvatar name={p.name} className="size-6 text-[11px]" />
                    {p.name}
                  </Link>
                ))}
              </div>
            ) : null}

            {s.memo ? <Memo text={s.memo} /> : null}
          </div>
        ))
      )}
    </div>
  );
}

/** スマホ：1画面まるごと詳細にする */
export function DayDetailScreen({ date, sessions, onBack }: Props) {
  const people = new Set(sessions.flatMap((s) => s.participants.map((p) => p.id)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-[15px] text-slate-700"
        >
          ← 戻る
        </button>
        <Link
          href={`/sessions/${date}/edit`}
          className="p-2 text-[15px] font-medium text-slate-700"
        >
          編集
        </Link>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <span
          className={`text-[22px] font-bold tracking-tight ${weekdayTextClass(date)}`}
        >
          {formatMonthDay(date)}
        </span>
        <span className="text-[13px] text-slate-500">
          {sessions.length}件の記録
          {people.size > 0 ? ` · ${people.size}人` : ""}
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          この日の記録はありません。
        </p>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[17px] font-bold">{s.game_title}</span>
                {s.tags.map((t) => (
                  <Tag key={t} name={t} />
                ))}
              </div>

              {s.participants.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {s.participants.map((p) => (
                    <Link
                      key={p.id}
                      href={`/people/${p.id}`}
                      className="flex items-center gap-2.5 text-[15px] text-slate-900"
                    >
                      <InitialAvatar name={p.name} className="size-8 text-[13px]" />
                      {p.name}
                    </Link>
                  ))}
                </div>
              ) : null}

              {s.memo ? <Memo text={s.memo} large /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
