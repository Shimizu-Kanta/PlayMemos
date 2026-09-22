import { createClient } from "@/lib/supabase/server";

import { byName } from "./games";

/** 記録フォームの1行（＝1 session） */
export type DayRow = {
  sessionId: string;
  gameId: string;
  gameTitle: string;
  memo: string;
  participantIds: string[];
};

export type GameOption = { id: string; title: string };
export type PersonOption = { id: string; name: string };

/** 指定日の記録を sort_order 順に取得する */
export async function getDayRows(date: string): Promise<DayRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session")
    .select("id, game_id, memo, sort_order, game(title), session_person(person_id)")
    .eq("played_on", date)
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    sessionId: row.id,
    gameId: row.game_id,
    gameTitle: row.game?.title ?? "(削除されたゲーム)",
    memo: row.memo ?? "",
    participantIds: (row.session_person ?? []).map((sp) => sp.person_id),
  }));
}

export async function getGameOptions(): Promise<GameOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("game").select("id, title");
  if (error) throw error;
  return (data ?? []).sort((a, b) => byName(a.title, b.title));
}

export async function getPersonOptions(): Promise<PersonOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("person").select("id, name");
  if (error) throw error;
  return (data ?? []).sort((a, b) => byName(a.name, b.name));
}
