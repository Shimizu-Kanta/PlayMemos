"use client";

import { useActionState } from "react";

import { InitialAvatar } from "@/components/avatar";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorMessage } from "@/components/ui/message";
import { useActionRunner } from "@/components/use-action-runner";
import type { PersonWithStats } from "@/lib/data/people";
import { formatDate } from "@/lib/date";

import { createPerson, deletePerson, renamePerson } from "./actions";

export function PersonList({ people }: { people: PersonWithStats[] }) {
  const [state, formAction, submitting] = useActionState(createPerson, null);

  return (
    <section className="space-y-3">
      <form
        action={formAction}
        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row"
      >
        <Input
          name="name"
          required
          maxLength={50}
          placeholder="名前を追加"
          disabled={submitting}
          className="sm:flex-1"
        />
        <Input
          name="discord_id"
          inputMode="numeric"
          pattern="[0-9]{17,20}"
          placeholder="Discord ID（任意・17〜20桁）"
          disabled={submitting}
          className="sm:w-64"
        />
        <Button type="submit" variant="primary" disabled={submitting}>
          追加
        </Button>
      </form>
      {state && !state.ok ? <ErrorMessage>{state.message}</ErrorMessage> : null}

      {people.length === 0 ? (
        <EmptyState>
          まだ友人が登録されていません。上の欄から追加してください。
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {people.map((person) => (
            <PersonRow key={person.id} person={person} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PersonRow({ person }: { person: PersonWithStats }) {
  const { pending, error, run } = useActionRunner();

  function handleDelete() {
    const warning =
      person.playCount > 0
        ? `${person.name} さんを削除すると、${person.playCount} 件の記録からも参加者として外れます。よろしいですか？`
        : `${person.name} さんを削除しますか？`;
    if (window.confirm(warning)) run(() => deletePerson(person.id));
  }

  return (
    <li className="space-y-1 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <InitialAvatar name={person.name} />
          <div className="min-w-0 flex-1">
            <EditableText
              value={person.name}
              maxLength={50}
              ariaLabel="名前"
              className="font-medium text-slate-900"
              onSave={(next) => renamePerson(person.id, next)}
            />
            <p className="mt-0.5 text-xs text-slate-500">
              {person.playCount > 0 && person.lastPlayedOn
                ? `${person.playCount}回 ・ 最後に遊んだ日 ${formatDate(person.lastPlayedOn)}`
                : "まだ一緒に遊んだ記録がありません"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="danger"
          onClick={handleDelete}
          disabled={pending}
        >
          削除
        </Button>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
    </li>
  );
}
