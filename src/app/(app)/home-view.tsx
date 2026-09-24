"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { InitialAvatar, personPalette } from "@/components/avatar";
import { useLocalPreference } from "@/components/use-local-preference";
import type { PersonWithStats } from "@/lib/data/people";
import type { GameOption, PreviousMembers } from "@/lib/data/sessions";
import type { TagWithUsage } from "@/lib/data/games";
import type { SessionDetail } from "@/lib/database.types";
import {
  addMonths,
  currentMonth,
  formatDateLong,
  formatMonth,
  monthOf,
  todayISO,
} from "@/lib/date";

import { DayDetailPanel, DayDetailScreen } from "./day-detail";
import { EmptyHome } from "./empty-home";
import {
  CompactCalendar,
  MonthCalendar,
  buildDays,
  type DayBucket,
} from "./month-calendar";
import { RecordSheet } from "./record-sheet";
import { SessionList } from "./session-list";

export type Filters = {
  /** タグは名前で持つ（session_detail が名前を返すため） */
  tags: string[];
  personIds: string[];
};

type Props = {
  month: string;
  monthSessions: SessionDetail[];
  /** 検索中だけ中身が入る（全期間から新しい順） */
  searchPool: SessionDetail[];
  query: string;
  tags: TagWithUsage[];
  people: PersonWithStats[];
  initialFilters: Filters;
  hasAnySession: boolean;
  /** 記録シートを開くか（?record=） */
  recordOpen: boolean;
  recordDate: string;
  games: GameOption[];
  recentGames: GameOption[];
  latestMembers: PreviousMembers | null;
};

const VIEW_STORAGE_KEY = "playmemos:home-view";
const HOME_VIEWS = ["calendar", "list"] as const;
const LIST_LIMIT = 100;

export function buildHomeHref(
  month: string,
  filters: Filters,
  query: string,
  record?: string,
) {
  const params = new URLSearchParams();
  params.set("month", month);
  if (record) params.set("record", record);
  if (query) params.set("q", query);
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.personIds.length > 0) {
    params.set("people", filters.personIds.join(","));
  }
  return `/?${params.toString()}`;
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/**
 * 最初に選んでおく日。
 * 今日に記録があれば今日、なければその月で一番新しい記録の日。
 */
function defaultSelectedDate(month: string, sessions: SessionDetail[]) {
  const today = todayISO();
  const inThisMonth = monthOf(today) === month;
  if (inThisMonth && sessions.some((s) => s.played_on === today)) return today;

  const latest = sessions.reduce<string | null>((acc, s) => {
    if (monthOf(s.played_on) !== month) return acc;
    return acc === null || s.played_on > acc ? s.played_on : acc;
  }, null);
  if (latest) return latest;

  return inThisMonth ? today : null;
}

function matchesQuery(s: SessionDetail, needle: string) {
  if (!needle) return true;
  const q = needle.toLowerCase();
  return (
    s.game_title.toLowerCase().includes(q) ||
    s.tags.some((t) => t.toLowerCase().includes(q)) ||
    s.participants.some((p) => p.name.toLowerCase().includes(q)) ||
    (s.memo ?? "").toLowerCase().includes(q)
  );
}

export function HomeView({
  month,
  monthSessions,
  searchPool,
  query,
  tags,
  people,
  initialFilters,
  hasAnySession,
  recordOpen,
  recordDate,
  games,
  recentGames,
  latestMembers,
}: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    defaultSelectedDate(month, monthSessions),
  );
  const [detailDate, setDetailDate] = useState<string | null>(null);
  // スマホの表示切り替えは前回の選択を覚えておく
  const [view, changeView] = useLocalPreference(
    VIEW_STORAGE_KEY,
    "calendar",
    HOME_VIEWS,
  );

  /** 絞り込みは即座に反映しつつ、URL にも残して月移動で保つ */
  function applyFilters(next: Filters) {
    setFilters(next);
    router.replace(buildHomeHref(month, next, query), { scroll: false });
  }

  const hasFilter = filters.tags.length > 0 || filters.personIds.length > 0;
  const searching = query.length > 0;

  const keep = useMemo(() => {
    const personIds = new Set(filters.personIds);
    const tagNames = new Set(filters.tags);
    return (s: SessionDetail) => {
      if (!matchesQuery(s, query)) return false;
      if (tagNames.size > 0 && !s.tags.some((t) => tagNames.has(t))) {
        return false;
      }
      if (
        personIds.size > 0 &&
        !s.participants.some((p) => personIds.has(p.id))
      ) {
        return false;
      }
      return true;
    };
  }, [filters, query]);

  const visibleInMonth = useMemo(
    () => monthSessions.filter(keep),
    [monthSessions, keep],
  );

  const listSessions = useMemo(
    () => (searching ? searchPool.filter(keep) : visibleInMonth).slice(0, LIST_LIMIT),
    [searching, searchPool, keep, visibleInMonth],
  );

  const days = useMemo(
    () => buildDays(month, visibleInMonth),
    [month, visibleInMonth],
  );

  const daySessions = useMemo(
    () =>
      selectedDate
        ? visibleInMonth.filter((s) => s.played_on === selectedDate)
        : [],
    [visibleInMonth, selectedDate],
  );

  // 月の見出しに出す「N回 · N人」は絞り込み前の合計
  const monthStats = useMemo(() => {
    const ids = new Set<string>();
    for (const s of monthSessions) for (const p of s.participants) ids.add(p.id);
    return { count: monthSessions.length, people: ids.size };
  }, [monthSessions]);

  function openDetail(date: string) {
    setSelectedDate(date);
    setDetailDate(date);
  }

  // 月を移動したら、その月の外の詳細は閉じたことにする
  const activeDetail =
    detailDate && (searching || monthOf(detailDate) === month)
      ? detailDate
      : null;

  // 詳細はその日の記録を全部出す（絞り込みでは減らさない）
  const detailSessions = useMemo(() => {
    if (!activeDetail) return [];
    const seen = new Set<string>();
    return [...monthSessions, ...searchPool].filter((s) => {
      if (s.played_on !== activeDetail || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [activeDetail, monthSessions, searchPool]);

  const selectedPerson =
    filters.personIds.length === 1
      ? (people.find((p) => p.id === filters.personIds[0]) ?? null)
      : null;

  const personMonthCount = useMemo(() => {
    if (!selectedPerson) return 0;
    return monthSessions.filter((s) =>
      s.participants.some((p) => p.id === selectedPerson.id),
    ).length;
  }, [monthSessions, selectedPerson]);

  const sheet = recordOpen ? (
    <RecordSheet
      initialDate={recordDate}
      people={people}
      games={games}
      recentGames={recentGames}
      latestMembers={latestMembers}
      onClose={() =>
        router.replace(buildHomeHref(month, filters, query), { scroll: false })
      }
      onSaved={(saved) => {
        setSelectedDate(saved);
        router.replace(buildHomeHref(monthOf(saved), filters, query), {
          scroll: false,
        });
        router.refresh();
      }}
    />
  ) : null;

  if (!hasAnySession && !searching && !hasFilter) {
    return (
      <>
        <EmptyHome month={month} recordHref={buildHomeHref(month, filters, query, "1")} />
        {sheet}
      </>
    );
  }

  const monthNav = (
    <div className="flex items-center gap-1.5">
      <span className="text-[17px] font-bold tracking-tight">
        {formatMonth(month)}
      </span>
      <span className="ml-1 text-xs text-slate-500">
        {monthStats.count}回 · {monthStats.people}人
      </span>
      <span className="ml-auto flex items-center gap-1">
        <Link
          href={buildHomeHref(addMonths(month, -1), filters, query)}
          aria-label="前の月"
          className="rounded-lg px-2.5 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          ←
        </Link>
        {month !== currentMonth() ? (
          <Link
            href={buildHomeHref(currentMonth(), filters, query)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
          >
            今月
          </Link>
        ) : null}
        <Link
          href={buildHomeHref(addMonths(month, 1), filters, query)}
          aria-label="次の月"
          className="rounded-lg px-2.5 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          →
        </Link>
      </span>
    </div>
  );

  const listHeading = searching
    ? `「${query}」の検索結果`
    : `${formatMonth(month).replace(/^\d+年/, "")}の記録`;

  return (
    <div className="space-y-4">
      <FilterBar
        tags={tags}
        people={people}
        filters={filters}
        query={query}
        selectedPerson={selectedPerson}
        personMonthCount={personMonthCount}
        month={month}
        onApply={applyFilters}
        onClearQuery={() =>
          router.replace(buildHomeHref(month, filters, ""), { scroll: false })
        }
      />

      {/* PC: カレンダーとリストを並べる */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 pb-3">
          <div className="mb-3 px-1">{monthNav}</div>
          <MonthCalendar
            month={month}
            days={days}
            selectedDate={selectedDate}
            highlightName={selectedPerson?.name ?? null}
            onSelect={setSelectedDate}
          />
        </div>

        {activeDetail ? (
          <DayDetailPanel
            date={activeDetail}
            sessions={detailSessions}
            onBack={() => setDetailDate(null)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-bold">{listHeading}</span>
              <span className="text-xs text-slate-500">
                {searching ? `${listSessions.length}件` : "新しい順"}
              </span>
            </div>
            <SessionList
              sessions={listSessions}
              selectedDate={selectedDate}
              emptyText={
                searching
                  ? "見つかりませんでした。"
                  : "この月の記録はまだありません。"
              }
              onSelect={openDetail}
            />
          </div>
        )}
      </div>

      {/* スマホ: 詳細を開いているあいだは 1 画面使う */}
      {activeDetail ? (
        <div className="lg:hidden">
          <DayDetailScreen
            date={activeDetail}
            sessions={detailSessions}
            onBack={() => setDetailDate(null)}
          />
        </div>
      ) : null}

      <div className={`space-y-3 lg:hidden ${activeDetail ? "hidden" : ""}`}>
        <div className="grid grid-cols-2 gap-0 rounded-[10px] bg-slate-100 p-[3px] text-center text-sm font-semibold">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => changeView(v)}
              className={
                view === v
                  ? "rounded-lg bg-white py-[9px] text-slate-900 shadow-sm"
                  : "rounded-lg py-[9px] text-slate-500"
              }
            >
              {v === "list" ? "リスト" : "カレンダー"}
            </button>
          ))}
        </div>

        {view === "calendar" ? (
          <div className="space-y-3">
            <div className="px-1">{monthNav}</div>
            <CompactCalendar
              month={month}
              days={days}
              selectedDate={selectedDate}
              highlightName={selectedPerson?.name ?? null}
              onSelect={setSelectedDate}
            />
            {selectedDate ? (
              <SelectedDayCard
                date={selectedDate}
                sessions={daySessions}
                recordHref={buildHomeHref(month, filters, query, selectedDate)}
                onOpen={() => openDetail(selectedDate)}
              />
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-bold">{listHeading}</span>
              <span className="text-xs text-slate-500">
                {searching ? `${listSessions.length}件` : "新しい順"}
              </span>
            </div>
            <SessionList
              sessions={listSessions}
              selectedDate={selectedDate}
              large
              onSelect={openDetail}
              emptyText={
                searching
                  ? "見つかりませんでした。"
                  : "この月の記録はまだありません。"
              }
            />
          </div>
        )}
      </div>

      <Link
        href={buildHomeHref(month, filters, query, "1")}
        scroll={false}
        className="fixed right-[18px] bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-30 rounded-full bg-slate-900 px-[22px] py-[15px] text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,.25)] lg:hidden"
      >
        ＋ 記録する
      </Link>

      {sheet}
    </div>
  );
}

function FilterBar({
  tags,
  people,
  filters,
  query,
  selectedPerson,
  personMonthCount,
  month,
  onApply,
  onClearQuery,
}: {
  tags: TagWithUsage[];
  people: PersonWithStats[];
  filters: Filters;
  query: string;
  selectedPerson: PersonWithStats | null;
  personMonthCount: number;
  month: string;
  onApply: (next: Filters) => void;
  onClearQuery: () => void;
}) {
  const personIds = new Set(filters.personIds);
  const tagNames = new Set(filters.tags);
  const hasFilter = filters.tags.length > 0 || filters.personIds.length > 0;

  return (
    <div className="space-y-2">
      {query ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">
            「{query}」で全期間を検索しています
          </span>
          <button
            type="button"
            onClick={onClearQuery}
            className="text-slate-500 underline underline-offset-2 hover:text-slate-900"
          >
            解除
          </button>
        </div>
      ) : null}

      {people.length > 0 ? (
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {people.map((p) => {
            const on = personIds.has(p.id);
            const palette = personPalette(p.name);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onApply({
                    ...filters,
                    personIds: toggle(filters.personIds, p.id),
                  })
                }
                className={[
                  "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-[13px]",
                  on
                    ? `${palette.surface} ${palette.border} ${palette.text} font-semibold`
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                ].join(" ")}
              >
                <InitialAvatar name={p.name} className="size-6 text-[11px]" />
                {p.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          <span className="shrink-0 text-xs text-slate-400">タグ</span>
          {tags.map((t) => {
            const on = tagNames.has(t.name);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onApply({ ...filters, tags: toggle(filters.tags, t.name) })
                }
                className={
                  on
                    ? "shrink-0 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white"
                    : "shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                }
              >
                {t.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {hasFilter ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {selectedPerson ? (
            <>
              <span className="text-slate-500">
                {selectedPerson.name} と {formatMonth(month).replace(/^\d+年/, "")}に {personMonthCount}回
              </span>
              <Link
                href={`/people/${selectedPerson.id}`}
                className="text-slate-600 underline underline-offset-2 hover:text-slate-900"
              >
                プロフィール
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => onApply({ tags: [], personIds: [] })}
            className="ml-auto text-slate-600 underline underline-offset-2 hover:text-slate-900"
          >
            絞り込みを解除
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SelectedDayCard({
  date,
  sessions,
  recordHref,
  onOpen,
}: {
  date: string;
  sessions: SessionDetail[];
  recordHref: string;
  onOpen: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-[13px] font-bold">{formatDateLong(date)}</span>
        <Link
          href={sessions.length > 0 ? `/sessions/${date}/edit` : recordHref}
          scroll={false}
          className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-900"
        >
          {sessions.length > 0 ? "編集" : "この日に記録する"}
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          この日の記録はありません。
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {sessions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={onOpen}
              className={`flex w-full items-center gap-3 px-3.5 py-3 text-left ${i === 0 ? "" : "border-t border-slate-100"}`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">
                  {s.game_title}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {s.participants.map((p) => p.name).join("、")}
                </span>
              </span>
              <span className="flex shrink-0">
                {s.participants.slice(0, 4).map((p) => (
                  <InitialAvatar
                    key={p.id}
                    name={p.name}
                    className="-ml-1.5 size-6.5 text-[11px] ring-2 ring-white"
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { DayBucket };
