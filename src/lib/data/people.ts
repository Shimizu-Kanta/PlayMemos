import type { SessionDetail } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

import { byName } from "./games";
import { getSessionsByIds } from "./sessions";

export type PersonWithStats = {
  id: string;
  name: string;
  discord_id: string | null;
  memo: string | null;
  /** 一緒に遊んだ回数（session の件数） */
  playCount: number;
  /** 最後に一緒に遊んだ日（YYYY-MM-DD） */
  lastPlayedOn: string | null;
  /** その人といちばん多く遊んだゲーム */
  topGame: string | null;
};

export async function getPeople(): Promise<PersonWithStats[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("person")
    .select(
      "id, name, discord_id, memo, session_person(session(played_on, game(title)))",
    );

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const played = (row.session_person ?? []).flatMap((sp) =>
        sp.session ? [sp.session] : [],
      );

      const counts = new Map<string, number>();
      for (const s of played) {
        const title = s.game?.title;
        if (title) counts.set(title, (counts.get(title) ?? 0) + 1);
      }
      const topGame =
        [...counts.entries()].sort(
          (a, b) => b[1] - a[1] || byName(a[0], b[0]),
        )[0]?.[0] ?? null;

      return {
        id: row.id,
        name: row.name,
        discord_id: row.discord_id,
        memo: row.memo,
        playCount: played.length,
        // YYYY-MM-DD は文字列比較で日付順になる
        lastPlayedOn:
          played.length > 0
            ? played.reduce(
                (a, s) => (s.played_on > a ? s.played_on : a),
                played[0].played_on,
              )
            : null,
        topGame,
      };
    })
    .sort((a, b) => byName(a.name, b.name));
}

/** 最後に遊んだ日が新しい順（遊んだことがない人は最後） */
export function byLastPlayed(a: PersonWithStats, b: PersonWithStats) {
  if (a.lastPlayedOn === b.lastPlayedOn) return byName(a.name, b.name);
  if (!a.lastPlayedOn) return 1;
  if (!b.lastPlayedOn) return -1;
  return a.lastPlayedOn < b.lastPlayedOn ? 1 : -1;
}

/** 友人1件を取得する（見つからなければ null） */
export async function getPerson(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("person")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** この人と一緒に遊んだ記録を新しい順に取得する */
export async function getPersonSessions(
  personId: string,
  limit = 200,
): Promise<SessionDetail[]> {
  const supabase = await createClient();

  const { data: links, error: linkError } = await supabase
    .from("session_person")
    .select("session_id")
    .eq("person_id", personId);
  if (linkError) throw linkError;

  const ids = (links ?? []).map((l) => l.session_id);
  if (ids.length === 0) return [];

  return getSessionsByIds(ids, limit);
}
