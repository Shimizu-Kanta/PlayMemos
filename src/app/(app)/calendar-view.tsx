"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import jaLocale from "@fullcalendar/core/locales/ja";

import { InitialAvatar } from "@/components/avatar";
import { FilterChips, type ChipOption } from "@/components/filter-chips";
import { Button } from "@/components/ui/button";
import type { SessionDetail } from "@/lib/database.types";
import type { GameOption, PersonOption } from "@/lib/data/sessions";
import type { TagWithUsage } from "@/lib/data/games";
import {
  addMonths,
  currentMonth,
  formatDateLong,
  formatMonth,
  toISODate,
} from "@/lib/date";

export type Filters = {
  /** タグは名前で持つ（session_detail が名前を返すため） */
  tags: string[];
  gameIds: string[];
  personIds: string[];
};

type Props = {
  month: string;
  sessions: SessionDetail[];
  tags: TagWithUsage[];
  games: GameOption[];
  people: PersonOption[];
  initialFilters: Filters;
};

function buildHref(month: string, filters: Filters) {
  const params = new URLSearchParams();
  params.set("month", month);
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.gameIds.length > 0) params.set("games", filters.gameIds.join(","));
  if (filters.personIds.length > 0) {
    params.set("people", filters.personIds.join(","));
  }
  return `/?${params.toString()}`;
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function CalendarView({
  month,
  sessions,
  tags,
  games,
  people,
  initialFilters,
}: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /** 絞り込みは即座に画面へ反映し、URL には残して月移動でも保つ */
  function applyFilters(next: Filters) {
    setFilters(next);
    router.replace(buildHref(month, next), { scroll: false });
  }

  const hasFilter =
    filters.tags.length > 0 ||
    filters.gameIds.length > 0 ||
    filters.personIds.length > 0;

  const visible = useMemo(
    () =>
      sessions.filter((s) => {
        if (filters.gameIds.length > 0 && !filters.gameIds.includes(s.game_id)) {
          return false;
        }
        if (
          filters.tags.length > 0 &&
          !s.tags.some((tag) => filters.tags.includes(tag))
        ) {
          return false;
        }
        if (
          filters.personIds.length > 0 &&
          !s.participants.some((p) => filters.personIds.includes(p.id))
        ) {
          return false;
        }
        return true;
      }),
    [sessions, filters],
  );

  const events = useMemo(
    () =>
      visible.map((s) => ({
        id: s.id,
        title: s.game_title,
        start: s.played_on,
        allDay: true,
        extendedProps: { sortOrder: s.sort_order },
      })),
    [visible],
  );

  const daySessions = useMemo(
    () =>
      selectedDate
        ? visible.filter((s) => s.played_on === selectedDate)
        : [],
    [visible, selectedDate],
  );

  const tagOptions: ChipOption[] = tags.map((t) => ({
    value: t.name,
    label: t.name,
  }));
  const gameOptions: ChipOption[] = games.map((g) => ({
    value: g.id,
    label: g.title,
  }));
  const peopleOptions: ChipOption[] = people.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={buildHref(addMonths(month, -1), filters)}
            aria-label="前の月"
            className="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            ←
          </Link>
          <h1 className="min-w-28 text-center text-lg font-bold tracking-tight">
            {formatMonth(month)}
          </h1>
          <Link
            href={buildHref(addMonths(month, 1), filters)}
            aria-label="次の月"
            className="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            →
          </Link>
          {month !== currentMonth() ? (
            <Link
              href={buildHref(currentMonth(), filters)}
              className="ml-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
            >
              今月
            </Link>
          ) : null}
        </div>

        <Link
          href="/sessions/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          記録する
        </Link>
      </div>

      <details
        open={hasFilter}
        className="rounded-xl border border-slate-200 bg-white"
      >
        <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-slate-700 select-none">
          絞り込み
          {hasFilter ? (
            <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
              {visible.length} / {sessions.length} 件
            </span>
          ) : null}
        </summary>

        <div className="space-y-4 border-t border-slate-100 px-4 py-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <FilterChips
              legend="タグ"
              options={tagOptions}
              selected={filters.tags}
              emptyText="タグがまだありません"
              onToggle={(v) =>
                applyFilters({ ...filters, tags: toggle(filters.tags, v) })
              }
            />
            <FilterChips
              legend="ゲーム"
              options={gameOptions}
              selected={filters.gameIds}
              emptyText="ゲームがまだありません"
              onToggle={(v) =>
                applyFilters({ ...filters, gameIds: toggle(filters.gameIds, v) })
              }
            />
            <FilterChips
              legend="参加者"
              options={peopleOptions}
              selected={filters.personIds}
              emptyText="友人がまだ登録されていません"
              onToggle={(v) =>
                applyFilters({
                  ...filters,
                  personIds: toggle(filters.personIds, v),
                })
              }
            />
          </div>

          {hasFilter ? (
            <Button
              size="sm"
              onClick={() =>
                applyFilters({ tags: [], gameIds: [], personIds: [] })
              }
            >
              絞り込みを解除
            </Button>
          ) : null}
        </div>
      </details>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="pm-calendar overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
          <FullCalendar
            /* 月が変わったら表示位置ごと作り直す */
            key={month}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={`${month}-01`}
            locale={jaLocale}
            headerToolbar={false}
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={false}
            eventOrder="sortOrder"
            eventDisplay="block"
            events={events}
            dateClick={(arg) => setSelectedDate(arg.dateStr)}
            eventClick={(arg) =>
              setSelectedDate(arg.event.startStr.slice(0, 10))
            }
            dayCellClassNames={(arg) =>
              toISODate(arg.date) === selectedDate ? ["pm-day-selected"] : []
            }
            /* 日本語ロケールの「30日」を数字だけにする */
            dayCellContent={(arg) => arg.dayNumberText.replace("日", "")}
            eventContent={(arg) => (
              <div className="truncate px-1 text-[11px] leading-5">
                {arg.event.title}
              </div>
            )}
          />
        </div>

        <DayPanel
          date={selectedDate}
          sessions={daySessions}
          filtered={hasFilter}
          onClose={() => setSelectedDate(null)}
        />
      </div>
    </div>
  );
}

function DayPanel({
  date,
  sessions,
  filtered,
  onClose,
}: {
  date: string | null;
  sessions: SessionDetail[];
  filtered: boolean;
  onClose: () => void;
}) {
  if (!date) {
    return (
      <aside className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        日付をクリックすると、その日の記録が出ます。
      </aside>
    );
  }

  return (
    <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20 lg:self-start">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-bold">{formatDateLong(date)}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="rounded px-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500">
          {filtered
            ? "絞り込みに合う記録がありません。"
            : "この日の記録はまだありません。"}
        </p>
      ) : (
        <ol className="space-y-3">
          {sessions.map((s, index) => (
            <li key={s.id} className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-slate-400">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{s.game_title}</span>
              </div>

              {s.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {s.participants.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {s.participants.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-xs text-slate-600"
                    >
                      <InitialAvatar
                        name={p.name}
                        className="size-5 text-[10px]"
                      />
                      {p.name}
                    </span>
                  ))}
                </div>
              ) : null}

              {s.memo ? (
                <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs whitespace-pre-wrap text-slate-600">
                  {s.memo}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <Link
        href={`/sessions/${date}/edit`}
        className="block rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-700"
      >
        {sessions.length > 0 ? "この日の記録を編集" : "この日に記録する"}
      </Link>
    </aside>
  );
}
