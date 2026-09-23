"use client";

import { useActionState, useState } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorMessage } from "@/components/ui/message";
import { useActionRunner } from "@/components/use-action-runner";
import type { GameWithTags, TagWithUsage } from "@/lib/data/games";

import {
  attachTag,
  createGame,
  createTagAndAttach,
  deleteGame,
  detachTag,
} from "./actions";

export function GameList({
  games,
  tags,
}: {
  games: GameWithTags[];
  tags: TagWithUsage[];
}) {
  const [state, formAction, submitting] = useActionState(createGame, null);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">ゲーム</h2>
        <span className="text-xs text-slate-500">{games.length}件</span>
      </div>

      <form action={formAction} className="flex gap-2">
        <Input
          name="title"
          required
          maxLength={100}
          placeholder="ゲーム名を追加（例：Among Us）"
          disabled={submitting}
        />
        <Button type="submit" variant="primary" disabled={submitting}>
          追加
        </Button>
      </form>
      {state && !state.ok ? <ErrorMessage>{state.message}</ErrorMessage> : null}

      {games.length === 0 ? (
        <EmptyState>
          まだゲームがありません。上の欄から追加してください。
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {games.map((game) => (
            <GameRow key={game.id} game={game} tags={tags} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GameRow({ game, tags }: { game: GameWithTags; tags: TagWithUsage[] }) {
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const { pending, error, setError, run } = useActionRunner();

  const attachedIds = new Set(game.tags.map((t) => t.id));

  function handleDelete() {
    // DB 側も on delete restrict で守られているが、先に分かるので手前で止める
    if (game.sessionCount > 0) {
      setError(
        `「${game.title}」には ${game.sessionCount} 件の記録があるため削除できません。先に記録を消してください。`,
      );
      return;
    }
    if (window.confirm(`「${game.title}」を削除しますか？`)) {
      run(() => deleteGame(game.id));
    }
  }

  return (
    <li className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link
            href={`/games/${game.id}`}
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            {game.title}
          </Link>

          <div className="flex flex-wrap items-center gap-1.5">
            {game.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2.5 pr-1 text-xs text-slate-600"
              >
                {tag.name}
                <button
                  type="button"
                  aria-label={`${tag.name} を外す`}
                  disabled={pending}
                  onClick={() => run(() => detachTag(game.id, tag.id))}
                  className="rounded-full px-1 leading-none text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTagPanelOpen((v) => !v)}
              aria-expanded={tagPanelOpen}
            >
              {tagPanelOpen ? "閉じる" : "＋ タグ"}
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs whitespace-nowrap text-slate-400">
            記録 {game.sessionCount}件
          </span>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            disabled={pending}
          >
            削除
          </Button>
        </div>
      </div>

      {tagPanelOpen ? (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          {tags.length === 0 ? (
            <p className="text-xs text-slate-500">
              タグがまだありません。下の欄から作れます。
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const attached = attachedIds.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={pending}
                    aria-pressed={attached}
                    onClick={() =>
                      run(() =>
                        attached
                          ? detachTag(game.id, tag.id)
                          : attachTag(game.id, tag.id),
                      )
                    }
                    className={
                      attached
                        ? "rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                        : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-slate-400 disabled:opacity-50"
                    }
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={newTagName}
              maxLength={50}
              placeholder="新しいタグ名"
              aria-label="新しいタグ名"
              disabled={pending}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (newTagName.trim()) {
                  run(() => createTagAndAttach(game.id, newTagName), () =>
                    setNewTagName(""),
                  );
                }
              }}
            />
            <Button
              size="sm"
              disabled={pending || newTagName.trim().length === 0}
              onClick={() =>
                run(() => createTagAndAttach(game.id, newTagName), () =>
                  setNewTagName(""),
                )
              }
            >
              作って付ける
            </Button>
          </div>
        </div>
      ) : null}

      <ErrorMessage>{error}</ErrorMessage>
    </li>
  );
}
