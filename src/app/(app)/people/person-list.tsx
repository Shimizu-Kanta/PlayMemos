"use client";

import { useActionState, useState } from "react";

import Link from "next/link";

import { InitialAvatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorMessage } from "@/components/ui/message";
import type { PersonWithStats } from "@/lib/data/people";
import { daysSince, relativeDayLabel } from "@/lib/date";

import { createPerson } from "./actions";

/** しばらく遊んでいない人はここから色を変える */
const STALE_DAYS = 30;

export function PersonList({ people }: { people: PersonWithStats[] }) {
  const [state, formAction, submitting] = useActionState(createPerson, null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h1 className="text-[17px] font-bold">友人 {people.length}人</h1>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="text-[13px] font-medium text-slate-700 transition hover:text-slate-900"
        >
          {addOpen ? "閉じる" : "＋ 追加"}
        </button>
      </div>

      {addOpen ? (
        <form
          action={formAction}
          className="flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-3 sm:flex-row"
        >
          <Input
            name="name"
            required
            autoFocus
            maxLength={50}
            placeholder="名前"
            disabled={submitting}
            className="sm:flex-1"
          />
          <Input
            name="discord_id"
            inputMode="numeric"
            pattern="[0-9]{17,20}"
            placeholder="Discord ID（任意・17〜20桁）"
            disabled={submitting}
            className="sm:w-56"
          />
          <Button type="submit" variant="primary" disabled={submitting}>
            追加
          </Button>
        </form>
      ) : null}

      {state && !state.ok ? <ErrorMessage>{state.message}</ErrorMessage> : null}

      {people.length === 0 ? (
        <EmptyState>
          まだ友人が登録されていません。「＋ 追加」から登録できます。
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
          {people.map((person, index) => (
            <PersonRow
              key={person.id}
              person={person}
              first={index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PersonRow({
  person,
  first,
}: {
  person: PersonWithStats;
  first: boolean;
}) {
  const stale =
    person.lastPlayedOn !== null && daysSince(person.lastPlayedOn) >= STALE_DAYS;
  const ago = person.lastPlayedOn
    ? relativeDayLabel(person.lastPlayedOn)
    : "記録なし";

  return (
    <Link
      href={`/?people=${person.id}`}
      className={[
        "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 px-4.5 py-3 transition hover:bg-slate-50",
        "sm:grid-cols-[40px_minmax(0,1fr)_90px_60px]",
        first ? "" : "border-t border-slate-100",
      ].join(" ")}
    >
      <InitialAvatar name={person.name} className="size-10 text-[15px]" />

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">
          {person.name}
        </span>
        <span className="truncate text-xs text-slate-500">
          <span className="sm:hidden">
            {person.playCount}回
            {person.topGame ? ` · ${person.topGame}` : ""}
          </span>
          <span className="hidden sm:inline">
            {person.topGame ? `よく遊ぶ: ${person.topGame}` : "記録なし"}
          </span>
        </span>
      </span>

      <span
        className={`text-right text-sm font-semibold ${stale ? "text-amber-700" : "text-slate-900"}`}
      >
        {ago}
      </span>

      <span className="hidden text-right text-[13px] text-slate-500 sm:block">
        {person.playCount}回
      </span>
    </Link>
  );
}
