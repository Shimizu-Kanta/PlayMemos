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
};

export async function getPeople(): Promise<PersonWithStats[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("person")
    .select("id, name, discord_id, memo, session_person(session(played_on))");

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const dates = (row.session_person ?? [])
        .map((sp) => sp.session?.played_on)
        .filter((d): d is string => typeof d === "string");

      return {
        id: row.id,
        name: row.name,
        discord_id: row.discord_id,
        memo: row.memo,
        playCount: dates.length,
        // YYYY-MM-DD は文字列比較で日付順になる
        lastPlayedOn: dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null,
      };
    })
    .sort((a, b) => byName(a.name, b.name));
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
