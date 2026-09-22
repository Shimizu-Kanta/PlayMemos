"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { InitialAvatar } from "@/components/avatar";
import { SearchDropdown, type Option } from "@/components/search-dropdown";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/message";
import { useActionRunner } from "@/components/use-action-runner";
import type { DayRow, GameOption, PersonOption } from "@/lib/data/sessions";
import { formatDateLong, isISODate } from "@/lib/date";

import { findOrCreateGame, findOrCreatePerson, saveDay } from "../../actions";

type Row = {
  /** React の key 用。DB には保存しない */
  key: string;
  sessionId: string | null;
  gameId: string | null;
  gameTitle: string;
  participantIds: string[];
  memo: string;
};

let keySeq = 0;
const nextKey = () => `row-${(keySeq += 1)}`;

const emptyRow = (): Row => ({
  key: nextKey(),
  sessionId: null,
  gameId: null,
  gameTitle: "",
  participantIds: [],
  memo: "",
});

const toRow = (row: DayRow): Row => ({ key: nextKey(), ...row });

const buildRows = (initial: DayRow[]): Row[] =>
  initial.length > 0 ? initial.map(toRow) : [emptyRow()];

/** 変更されたかを比べるための、key を含まない表現 */
const snapshot = (rows: Row[]) =>
  JSON.stringify(
    rows.map((r) => [
      r.sessionId,
      r.gameId,
      [...r.participantIds].sort(),
      r.memo.trim(),
    ]),
  );

const isBlank = (row: Row) =>
  !row.gameId && row.participantIds.length === 0 && row.memo.trim() === "";

function mergeOptions(base: Option[], extra: Option[]): Option[] {
  const map = new Map(base.map((o) => [o.id, o]));
  for (const o of extra) if (!map.has(o.id)) map.set(o.id, o);
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

type Props = {
  date: string;
  initialRows: DayRow[];
  games: GameOption[];
  people: PersonOption[];
};

export function DayForm({ date, initialRows, games, people }: Props) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(() => buildRows(initialRows));
  const [baseline, setBaseline] = useState(() =>
    snapshot(buildRows(initialRows)),
  );
  const [localGames, setLocalGames] = useState<GameOption[]>([]);
  const [localPeople, setLocalPeople] = useState<PersonOption[]>([]);
  const [dateDraft, setDateDraft] = useState(date);
  const [saved, setSaved] = useState<string | null>(null);
  const { pending, error, setError, run } = useActionRunner();

  const gameOptions = useMemo(
    () =>
      mergeOptions(
        games.map((g) => ({ id: g.id, label: g.title })),
        localGames.map((g) => ({ id: g.id, label: g.title })),
      ),
    [games, localGames],
  );

  const peopleOptions = useMemo(
    () =>
      mergeOptions(
        people.map((p) => ({ id: p.id, label: p.name })),
        localPeople.map((p) => ({ id: p.id, label: p.name })),
      ),
    [people, localPeople],
  );

  const peopleById = useMemo(
    () => new Map(peopleOptions.map((o) => [o.id, o.label])),
    [peopleOptions],
  );

  const dirty = snapshot(rows) !== baseline;

  /** 行を書き換えるときは、保存済み表示とエラーを消す */
  function update(updater: (prev: Row[]) => Row[]) {
    setSaved(null);
    setError(null);
    setRows(updater);
  }

  const patchRow = (key: string, patch: Partial<Row>) =>
    update((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function moveRow(index: number, direction: -1 | 1) {
    update((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function copyParticipantsFromPrevious(index: number) {
    update((prev) => {
      if (index === 0) return prev;
      const next = [...prev];
      next[index] = {
        ...next[index],
        participantIds: [...prev[index - 1].participantIds],
      };
      return next;
    });
  }

  function toggleParticipant(key: string, personId: string) {
    update((prev) =>
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
  }

  function createGame(key: string, title: string) {
    run(async () => {
      const result = await findOrCreateGame(title);
      if (result.ok) {
        setLocalGames((prev) => [
          ...prev,
          { id: result.id, title: result.label },
        ]);
        patchRow(key, { gameId: result.id, gameTitle: result.label });
      }
      return result;
    });
  }

  function createPerson(key: string, name: string) {
    run(async () => {
      const result = await findOrCreatePerson(name);
      if (result.ok) {
        setLocalPeople((prev) => [
          ...prev,
          { id: result.id, name: result.label },
        ]);
        update((prev) =>
          prev.map((r) =>
            r.key === key && !r.participantIds.includes(result.id)
              ? { ...r, participantIds: [...r.participantIds, result.id] }
              : r,
          ),
        );
      }
      return result;
    });
  }

  function goToDate(next: string) {
    if (next === date || !isISODate(next)) return;
    if (
      dirty &&
      !window.confirm(
        "保存していない変更があります。日付を変えると失われますが、よろしいですか？",
      )
    ) {
      return;
    }
    router.push(`/sessions/${next}/edit`);
  }

  function handleSave() {
    // 何も入っていない行は無視する
    const target = rows.filter((r) => !isBlank(r));

    const missing = target.findIndex((r) => !r.gameId);
    if (missing >= 0) {
      setError(`${missing + 1}行目のゲームが選ばれていません。`);
      return;
    }

    if (target.length === 0) {
      if (initialRows.length === 0) {
        setError("ゲームを1つ以上追加してください。");
        return;
      }
      if (!window.confirm("この日の記録をすべて削除します。よろしいですか？")) {
        return;
      }
    }

    run(async () => {
      const result = await saveDay(
        date,
        target.map((r) => ({
          sessionId: r.sessionId,
          gameId: r.gameId as string,
          memo: r.memo,
          participantIds: r.participantIds,
        })),
      );

      if (result.ok) {
        // 新しく作られた session の id を取り込み、次の保存でも同じ行として扱えるようにする
        const withIds = target.map((r, i) => ({
          ...r,
          sessionId: result.sessionIds[i] ?? r.sessionId,
        }));
        const next = withIds.length > 0 ? withIds : [emptyRow()];
        setRows(next);
        setBaseline(snapshot(next));
        setSaved(result.message);
      }
      return result;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label
            htmlFor="played-on"
            className="block text-xs font-medium text-slate-500"
          >
            日付
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Input
              id="played-on"
              type="date"
              value={dateDraft}
              disabled={pending}
              className="w-44"
              onChange={(e) => setDateDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goToDate(dateDraft);
                }
              }}
            />
            {/* 日付入力は途中の値でも change が飛ぶので、移動は明示的に行う */}
            {dateDraft !== date && isISODate(dateDraft) ? (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => goToDate(dateDraft)}
              >
                この日に移動
              </Button>
            ) : (
              <span className="text-sm text-slate-600">
                {formatDateLong(date)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved ? (
            <span className="text-sm text-emerald-600">{saved}</span>
          ) : null}
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            {pending ? "保存中…" : "保存する"}
          </Button>
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-400">
                {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="上へ移動"
                  disabled={pending || index === 0}
                  onClick={() => moveRow(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="下へ移動"
                  disabled={pending || index === rows.length - 1}
                  onClick={() => moveRow(index, 1)}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={() =>
                    update((prev) => prev.filter((r) => r.key !== row.key))
                  }
                >
                  行を削除
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="block text-xs font-medium text-slate-500">
                  ゲーム
                </span>
                {row.gameId ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.gameTitle}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        patchRow(row.key, { gameId: null, gameTitle: "" })
                      }
                    >
                      選び直す
                    </Button>
                  </div>
                ) : (
                  <SearchDropdown
                    placeholder="ゲームを検索 / 新規作成"
                    options={gameOptions}
                    disabled={pending}
                    createLabel={(q) => `「${q}」を新しく作る`}
                    onSelect={(option) =>
                      patchRow(row.key, {
                        gameId: option.id,
                        gameTitle: option.label,
                      })
                    }
                    onCreate={(title) => createGame(row.key, title)}
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    参加者
                  </span>
                  {index > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => copyParticipantsFromPrevious(index)}
                    >
                      前の行の参加者をコピー
                    </Button>
                  ) : null}
                </div>

                {row.participantIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {row.participantIds.map((id) => {
                      const name = peopleById.get(id) ?? "(不明)";
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-1.5 text-xs text-slate-700"
                        >
                          <InitialAvatar
                            name={name}
                            className="size-5 text-[10px]"
                          />
                          {name}
                          <button
                            type="button"
                            aria-label={`${name} を外す`}
                            disabled={pending}
                            onClick={() => toggleParticipant(row.key, id)}
                            className="rounded-full px-1 leading-none text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : null}

                <SearchDropdown
                  placeholder="友人を検索 / 新規登録"
                  options={peopleOptions}
                  excludeIds={new Set(row.participantIds)}
                  disabled={pending}
                  keepOpenAfterSelect
                  createLabel={(q) => `「${q}」を新しく登録する`}
                  onSelect={(option) => toggleParticipant(row.key, option.id)}
                  onCreate={(name) => createPerson(row.key, name)}
                />
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <label
                htmlFor={`memo-${row.key}`}
                className="block text-xs font-medium text-slate-500"
              >
                メモ
              </label>
              <Textarea
                id={`memo-${row.key}`}
                rows={2}
                value={row.memo}
                disabled={pending}
                placeholder="覚えておきたいことがあれば"
                onChange={(e) => patchRow(row.key, { memo: e.target.value })}
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          disabled={pending}
          onClick={() => update((prev) => [...prev, emptyRow()])}
        >
          ＋ ゲームを追加
        </Button>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            カレンダーへ戻る
          </Link>
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            {pending ? "保存中…" : "保存する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
