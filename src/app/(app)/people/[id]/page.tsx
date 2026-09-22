import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { InitialAvatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui/message";
import { getPerson, getPersonSessions } from "@/lib/data/people";
import { formatDate, formatDateLong } from "@/lib/date";

import { PersonDetailForm } from "./person-detail-form";

export async function generateMetadata({
  params,
}: PageProps<"/people/[id]">): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id);
  return { title: person ? person.name : "友人" };
}

export default async function PersonPage({
  params,
}: PageProps<"/people/[id]">) {
  const { id } = await params;

  const person = await getPerson(id);
  if (!person) notFound();

  const sessions = await getPersonSessions(id);
  const lastPlayedOn = sessions[0]?.played_on ?? null;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/people"
          className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          ← 友人一覧
        </Link>

        <div className="mt-2 flex items-center gap-3">
          <InitialAvatar name={person.name} className="size-11 text-base" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{person.name}</h1>
            <p className="text-sm text-slate-500">
              {sessions.length > 0 && lastPlayedOn
                ? `${sessions.length}回 ・ 最後に遊んだ日 ${formatDate(lastPlayedOn)}`
                : "まだ一緒に遊んだ記録がありません"}
            </p>
          </div>
        </div>
      </div>

      <PersonDetailForm person={person} playCount={sessions.length} />

      <section className="space-y-3">
        <h2 className="text-base font-bold">一緒に遊んだ記録</h2>

        {sessions.length === 0 ? (
          <EmptyState>
            この友人が参加した記録はまだありません。
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {sessions.map((s) => {
              const others = s.participants.filter((p) => p.id !== id);
              return (
                <li key={s.id} className="space-y-1.5 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{s.game_title}</span>
                    <Link
                      href={`/sessions/${s.played_on}/edit`}
                      className="text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                    >
                      {formatDateLong(s.played_on)}
                    </Link>
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

                  {others.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400">ほかに</span>
                      {others.map((p) => (
                        <Link
                          key={p.id}
                          href={`/people/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          <InitialAvatar
                            name={p.name}
                            className="size-5 text-[10px]"
                          />
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {s.memo ? (
                    <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs whitespace-pre-wrap text-slate-600">
                      {s.memo}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
