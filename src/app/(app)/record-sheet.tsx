"use client";

import { useEffect, useState } from "react";

import { InitialAvatar } from "@/components/avatar";
import { SearchDropdown, type Option } from "@/components/search-dropdown";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/message";
import { useActionRunner } from "@/components/use-action-runner";
import type { PersonWithStats } from "@/lib/data/people";
import type { GameOption, PreviousMembers } from "@/lib/data/sessions";
import { formatDate, isISODate, todayISO } from "@/lib/date";

import {
  appendSessions,
  findOrCreateGame,
  findOrCreatePerson,
} from "./sessions/actions";

type Row = {
  key: string;
  gameId: string | null;
  gameTitle: string;
  participantIds: string[];
  memo: string;
  memoOpen: boolean;
};

let rowSeq = 0;
const newRow = (participantIds: string[] = []): Row => ({
  key: `quick-${(rowSeq += 1)}`,
  gameId: null,
  gameTitle: "",
  participantIds,
  memo: "",
  memoOpen: false,
});

const LABEL = "text-xs font-semibold text-slate-500";

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "9/24(木)" */
function shortLabel(iso: string) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}/${d}(${weekdays[date.getDay()]})`;
}

type Props = {
  initialDate: string;
  people: PersonWithStats[];
  games: GameOption[];
  recentGames: GameOption[];
  latestMembers: PreviousMembers | null;
  onClose: () => void;
  onSaved: (date: string) => void;
};

export function RecordSheet({
  initialDate,
  people,
  games,
  recentGames,
  latestMembers,
  onClose,
  onSaved,
}: Props) {
  const today = todayISO();
  const yesterday = yesterdayISO();

  const [date, setDate] = useState(initialDate);
  const [datePickerOpen, setDatePickerOpen] = useState(
    initialDate !== today && initialDate !== yesterday,
  );
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [localPeople, setLocalPeople] = useState<Option[]>([]);
  const [localGames, setLocalGames] = useState<Option[]>([]);
  const [newPersonOpen, setNewPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const { pending, error, setError, run } = useActionRunner();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const peopleOptions: Option[] = [
    ...people.map((p) => ({ id: p.id, label: p.name })),
    ...localPeople.filter((l) => !people.some((p) => p.id === l.id)),
  ];
  const gameOptions: Option[] = [
    ...games.map((g) => ({ id: g.id, label: g.title })),
    ...localGames.filter((l) => !games.some((g) => g.id === l.id)),
  ];
  const patch = (key: string, next: Partial<Row>) => {
    setError(null);
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...next } : r)),
    );
  };

  const toggleParticipant = (key: string, personId: string) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const has = r.participantIds.includes(personId);
        return {
          ...r,
          participantIds: has
            ? r.participantIds.filter((id) => id !== personId)
            : [...r.participantIds, personId],
        };
      }),
    );

  function addPerson(key: string, name: string) {
    run(async () => {
      const result = await findOrCreatePerson(name);
      if (result.ok) {
        setLocalPeople((prev) => [...prev, { id: result.id, label: result.label }]);
        setRows((prev) =>
          prev.map((r) =>
            r.key === key && !r.participantIds.includes(result.id)
              ? { ...r, participantIds: [...r.participantIds, result.id] }
              : r,
          ),
        );
        setNewPersonName("");
        setNewPersonOpen(false);
      }
      return result;
    });
  }

  function addGame(key: string, title: string) {
    run(async () => {
      const result = await findOrCreateGame(title);
      if (result.ok) {
        setLocalGames((prev) => [...prev, { id: result.id, label: result.label }]);
        patch(key, { gameId: result.id, gameTitle: result.label });
      }
      return result;
    });
  }

  const totalPeople = new Set(rows.flatMap((r) => r.participantIds)).size;

  function handleSave() {
    const missing = rows.findIndex((r) => !r.gameId);
    if (missing >= 0) {
      setError(
        rows.length > 1
          ? `${missing + 1}つ目のゲームを選んでください。`
          : "ゲームを選んでください。",
      );
      return;
    }

    run(
      () =>
        appendSessions(
          date,
          rows.map((r) => ({
            gameId: r.gameId as string,
            memo: r.memo,
            participantIds: r.participantIds,
          })),
        ),
      () => onSaved(date),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="記録する"
        className="flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[22px] bg-white shadow-[0_20px_50px_rgba(15,23,42,.25)] sm:rounded-2xl"
      >
        <div className="shrink-0 px-[22px] pt-3 sm:pt-[18px]">
          <div className="mx-auto mb-1 h-1 w-9 rounded-full bg-slate-300 sm:hidden" />
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold">記録する</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-sm text-slate-500 transition hover:text-slate-900"
            >
              <span className="sm:hidden">閉じる</span>
              <span className="hidden text-lg sm:inline">×</span>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-[22px] py-[18px]">
          {/* いつ */}
          <div className="space-y-2">
            <span className={`block ${LABEL}`}>いつ</span>
            <div className="flex flex-wrap gap-1.5 text-[13px]">
              {[
                { value: today, label: `今日 ${shortLabel(today)}` },
                { value: yesterday, label: "昨日" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={date === c.value && !datePickerOpen}
                  onClick={() => {
                    setDate(c.value);
                    setDatePickerOpen(false);
                  }}
                  className={
                    date === c.value && !datePickerOpen
                      ? "min-h-9 rounded-full bg-slate-900 px-3.5 font-medium text-white"
                      : "min-h-9 rounded-full border border-slate-200 px-3.5 text-slate-700"
                  }
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={datePickerOpen}
                onClick={() => setDatePickerOpen(true)}
                className={
                  datePickerOpen
                    ? "min-h-9 rounded-full bg-slate-900 px-3.5 font-medium text-white"
                    : "min-h-9 rounded-full border border-slate-200 px-3.5 text-slate-700"
                }
              >
                日付を選ぶ
              </button>
            </div>
            {datePickerOpen ? (
              <Input
                type="date"
                value={date}
                aria-label="日付"
                className="w-44"
                onChange={(e) => {
                  if (isISODate(e.target.value)) setDate(e.target.value);
                }}
              />
            ) : null}
          </div>

          {rows.map((row, index) => (
            <div
              key={row.key}
              className={
                index === 0
                  ? "space-y-5"
                  : "space-y-5 border-t border-slate-100 pt-5"
              }
            >
              {rows.length > 1 ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    {index + 1}つ目
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      setRows((prev) => prev.filter((r) => r.key !== row.key))
                    }
                  >
                    消す
                  </Button>
                </div>
              ) : null}

              {/* 誰と */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={LABEL}>誰と</span>
                  {latestMembers ? (
                    <button
                      type="button"
                      disabled={pending}
                      title={latestMembers.participants
                        .map((p) => p.name)
                        .join("、")}
                      onClick={() =>
                        patch(row.key, {
                          participantIds: latestMembers.participants.map(
                            (p) => p.id,
                          ),
                        })
                      }
                      className="text-xs font-medium text-slate-700 hover:underline"
                    >
                      前回のメンバー（{formatDate(latestMembers.playedOn)}）
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {peopleOptions.map((p) => {
                    const on = row.participantIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        disabled={pending}
                        onClick={() => toggleParticipant(row.key, p.id)}
                        className={[
                          "flex min-h-10 items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-[13px] sm:min-h-8",
                          on
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700",
                        ].join(" ")}
                      >
                        <InitialAvatar name={p.label} className="size-6 text-[11px]" />
                        {p.label}
                      </button>
                    );
                  })}

                  {newPersonOpen ? (
                    <span className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        value={newPersonName}
                        maxLength={50}
                        aria-label="新しい友人の名前"
                        placeholder="名前"
                        disabled={pending}
                        className="w-32"
                        onChange={(e) => setNewPersonName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (newPersonName.trim()) addPerson(row.key, newPersonName);
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={pending || !newPersonName.trim()}
                        onClick={() => addPerson(row.key, newPersonName)}
                      >
                        追加
                      </Button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setNewPersonOpen(true)}
                      className="min-h-10 rounded-full border border-dashed border-slate-300 px-3 text-[13px] text-slate-500 sm:min-h-8"
                    >
                      ＋ 新しい友人
                    </button>
                  )}
                </div>
              </div>

              {/* 何を */}
              <div className="space-y-2">
                <span className={`block ${LABEL}`}>何を</span>
                {row.gameId ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.gameTitle}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => patch(row.key, { gameId: null, gameTitle: "" })}
                    >
                      選び直す
                    </Button>
                  </div>
                ) : (
                  <>
                    <SearchDropdown
                      placeholder="ゲームを検索 / 新しく作る"
                      options={gameOptions}
                      disabled={pending}
                      createLabel={(q) => `「${q}」を新しく作る`}
                      onSelect={(option) =>
                        patch(row.key, {
                          gameId: option.id,
                          gameTitle: option.label,
                        })
                      }
                      onCreate={(title) => addGame(row.key, title)}
                    />
                    {recentGames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {recentGames.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              patch(row.key, { gameId: g.id, gameTitle: g.title })
                            }
                            className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-slate-200"
                          >
                            {g.title}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* メモ */}
              {row.memoOpen ? (
                <div className="space-y-1">
                  <span className={`block ${LABEL}`}>メモ</span>
                  <Textarea
                    rows={2}
                    value={row.memo}
                    disabled={pending}
                    placeholder="覚えておきたいことがあれば"
                    onChange={(e) => patch(row.key, { memo: e.target.value })}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => patch(row.key, { memoOpen: true })}
                  className="text-[13px] text-slate-500 hover:text-slate-900"
                >
                  ＋ メモを書く
                </button>
              )}
            </div>
          ))}

          <ErrorMessage>{error}</ErrorMessage>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-[22px] py-3.5">
          {/* Button は inline-flex を持つので、hidden は親側で当てる */}
          <div className="hidden items-center justify-between gap-3 sm:flex">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  newRow([...prev[prev.length - 1].participantIds]),
                ])
              }
              className="text-[13px] text-slate-600 hover:text-slate-900"
            >
              ＋ 同じ日に別のゲーム
            </button>
            <Button variant="primary" disabled={pending} onClick={handleSave}>
              {pending ? "記録中…" : "記録する"}
            </Button>
          </div>

          <div className="space-y-2 sm:hidden">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  newRow([...prev[prev.length - 1].participantIds]),
                ])
              }
              className="text-[13px] text-slate-600"
            >
              ＋ 同じ日に別のゲーム
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="w-full rounded-xl bg-slate-900 py-[15px] text-base font-semibold text-white disabled:opacity-70"
            >
              {pending
                ? "記録中…"
                : totalPeople > 0
                  ? `${totalPeople}人と記録する`
                  : "記録する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
