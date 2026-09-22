import { createClient } from "@/lib/supabase/server";

import { byName } from "./games";

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
