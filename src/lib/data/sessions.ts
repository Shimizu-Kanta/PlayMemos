import type { Participant, SessionDetail } from "@/lib/database.types";
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

/** session_detail.participants（jsonb）を型付きの配列にする */
function toParticipants(value: unknown): Participant[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }
    return [
      {
        id: record.id,
        name: record.name,
        discord_id:
          typeof record.discord_id === "string" ? record.discord_id : null,
      },
    ];
  });
}

/** 期間内の記録を、日付＋その日の並び順で取得する */
export async function getSessionsInRange(
  from: string,
  to: string,
): Promise<SessionDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("*")
    .gte("played_on", from)
    .lte("played_on", to)
    .order("played_on")
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    played_on: row.played_on,
    sort_order: row.sort_order,
    memo: row.memo,
    game_id: row.game_id,
    game_title: row.game_title,
    tags: row.tags ?? [],
    participants: toParticipants(row.participants),
  }));
}
