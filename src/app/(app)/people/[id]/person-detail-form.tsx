"use client";

import { useActionState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/message";
import { useActionRunner } from "@/components/use-action-runner";
import type { Person } from "@/lib/database.types";

import { deletePerson, updatePerson } from "../actions";

export function PersonDetailForm({
  person,
  playCount,
}: {
  person: Person;
  playCount: number;
}) {
  const router = useRouter();
  const [state, formAction, submitting] = useActionState(
    updatePerson.bind(null, person.id),
    null,
  );
  const { pending, error, run } = useActionRunner();

  function handleDelete() {
    const warning =
      playCount > 0
        ? `${person.name} さんを削除すると、${playCount} 件の記録からも参加者として外れます。よろしいですか？`
        : `${person.name} さんを削除しますか？`;
    if (!window.confirm(warning)) return;
    run(() => deletePerson(person.id), () => router.push("/people"));
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-500"
            >
              名前
            </label>
            <Input
              id="name"
              name="name"
              required
              maxLength={50}
              defaultValue={person.name}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="discord_id"
              className="block text-xs font-medium text-slate-500"
            >
              Discord ID（任意）
            </label>
            <Input
              id="discord_id"
              name="discord_id"
              inputMode="numeric"
              pattern="[0-9]{17,20}"
              placeholder="17〜20桁の数字"
              defaultValue={person.discord_id ?? ""}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="memo"
            className="block text-xs font-medium text-slate-500"
          >
            メモ
          </label>
          <Textarea
            id="memo"
            name="memo"
            rows={3}
            defaultValue={person.memo ?? ""}
            placeholder="好きなゲーム、遊べる時間帯など"
            disabled={submitting}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "保存中…" : "保存する"}
            </Button>
            {state?.ok && state.message ? (
              <span className="text-sm text-emerald-600">{state.message}</span>
            ) : null}
          </div>

          <Button variant="danger" onClick={handleDelete} disabled={pending}>
            この友人を削除
          </Button>
        </div>
      </form>

      {state && !state.ok ? <ErrorMessage>{state.message}</ErrorMessage> : null}
      <ErrorMessage>{error}</ErrorMessage>
    </section>
  );
}
