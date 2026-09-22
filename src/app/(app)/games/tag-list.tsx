"use client";

import { useActionState } from "react";

import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorMessage } from "@/components/ui/message";
import { useActionRunner } from "@/components/use-action-runner";
import type { TagWithUsage } from "@/lib/data/games";

import { createTag, deleteTag, renameTag } from "./actions";

export function TagList({ tags }: { tags: TagWithUsage[] }) {
  const [state, formAction, submitting] = useActionState(createTag, null);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">タグ</h2>
        <span className="text-xs text-slate-500">{tags.length}件</span>
      </div>

      <form action={formAction} className="flex gap-2">
        <Input
          name="name"
          required
          maxLength={50}
          placeholder="タグ名を追加（例：人狼系）"
          disabled={submitting}
        />
        <Button type="submit" variant="primary" disabled={submitting}>
          追加
        </Button>
      </form>
      {state && !state.ok ? <ErrorMessage>{state.message}</ErrorMessage> : null}

      {tags.length === 0 ? (
        <EmptyState>
          まだタグがありません。ゲームの特徴（人狼系・FPS など）を登録できます。
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TagRow({ tag }: { tag: TagWithUsage }) {
  const { pending, error, run } = useActionRunner();

  function handleDelete() {
    const warning =
      tag.gameCount > 0
        ? `「${tag.name}」は ${tag.gameCount} 件のゲームに付いています。削除するとそのゲームから外れます。よろしいですか？`
        : `「${tag.name}」を削除しますか？`;
    if (window.confirm(warning)) run(() => deleteTag(tag.id));
  }

  return (
    <li className="space-y-1 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <EditableText
            value={tag.name}
            maxLength={50}
            ariaLabel="タグ名"
            className="text-sm text-slate-900"
            onSave={(next) => renameTag(tag.id, next)}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs whitespace-nowrap text-slate-400">
            {tag.gameCount}ゲーム
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
      <ErrorMessage>{error}</ErrorMessage>
    </li>
  );
}
