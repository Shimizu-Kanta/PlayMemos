import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { InitialAvatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui/message";
import { getGame, getTags } from "@/lib/data/games";
import { getGameSessions } from "@/lib/data/sessions";
import type { SessionDetail } from "@/lib/database.types";
import { formatDate, formatDateLong } from "@/lib/date";

import { GameDetail } from "./game-detail";

export async function generateMetadata({
  params,
}: PageProps<"/games/[id]">): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  return { title: game ? game.title : "ゲーム" };
}

/** よく一緒に遊ぶ人を回数順に並べる */
function frequentPartners(sessions: SessionDetail[]) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const s of sessions) {
    for (const p of s.participants) {
      const current = counts.get(p.id);
      if (current) current.count += 1;
      else counts.set(p.id, { name: p.name, count: 1 });
    }
  }
  return [...counts.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"))
    .slice(0, 8);
}

export default async function GamePage({ params }: PageProps<"/games/[id]">) {
  const { id } = await params;

  const game = await getGame(id);
  if (!game) notFound();

  const [sessions, tags] = await Promise.all([getGameSessions(id), getTags()]);
  const lastPlayedOn = sessions[0]?.played_on ?? null;
  const partners = frequentPartners(sessions);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/games"
          className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          ← ゲーム・タグ
        </Link>
        <p className="mt-2 text-sm text-slate-500">
          {sessions.length > 0 && lastPlayedOn
            ? `${sessions.length}回 ・ 最後に遊んだ日 ${formatDate(lastPlayedOn)}`
            : "まだ遊んだ記録がありません"}
        </p>
      </div>

      <GameDetail game={game} tags={tags} />

      {partners.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-base font-bold">よく一緒に遊ぶ人</h2>
          <div className="flex flex-wrap gap-2">
            {partners.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 text-sm text-slate-700 transition hover:border-slate-400"
              >
                <InitialAvatar name={p.name} className="size-6 text-[11px]" />
                {p.name}
                <span className="text-xs text-slate-400">{p.count}回</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-bold">遊んだ記録</h2>

        {sessions.length === 0 ? (
          <EmptyState>このゲームの記録はまだありません。</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {sessions.map((s) => (
              <li key={s.id} className="space-y-1.5 p-3">
                <Link
                  href={`/sessions/${s.played_on}/edit`}
                  className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                >
                  {formatDateLong(s.played_on)}
                </Link>

                {s.participants.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.participants.map((p) => (
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
                ) : (
                  <p className="text-xs text-slate-400">参加者の記録なし</p>
                )}

                {s.memo ? (
                  <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs whitespace-pre-wrap text-slate-600">
                    {s.memo}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
