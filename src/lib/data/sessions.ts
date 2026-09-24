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

  return (data ?? []).map(toSessionDetail);
}

/** session_detail の1行をアプリ側の型にする */
function toSessionDetail(row: {
  id: string;
  played_on: string;
  sort_order: number;
  memo: string | null;
  game_id: string;
  game_title: string;
  tags: string[] | null;
  participants: unknown;
}): SessionDetail {
  return {
    id: row.id,
    played_on: row.played_on,
    sort_order: row.sort_order,
    memo: row.memo,
    game_id: row.game_id,
    game_title: row.game_title,
    tags: row.tags ?? [],
    participants: toParticipants(row.participants),
  };
}

/** id を指定して記録を取得する（新しい日付から、同じ日は並び順どおり） */
export async function getSessionsByIds(
  ids: string[],
  limit = 200,
): Promise<SessionDetail[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("*")
    .in("id", ids)
    .order("played_on", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toSessionDetail);
}

/** そのゲームを遊んだ記録を新しい順に取得する */
export async function getGameSessions(
  gameId: string,
  limit = 200,
): Promise<SessionDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("*")
    .eq("game_id", gameId)
    .order("played_on", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toSessionDetail);
}

export type PreviousMembers = {
  playedOn: string;
  participants: Participant[];
};

/**
 * 指定日より前で、いちばん最近の「参加者がいる記録」のメンバーを返す。
 * 記録フォームの「前回のメンバー」に使う。
 */
export async function getPreviousMembers(
  date: string,
): Promise<PreviousMembers | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("played_on, sort_order, participants")
    .lt("played_on", date)
    .order("played_on", { ascending: false })
    .order("sort_order", { ascending: false })
    .limit(10);

  if (error) throw error;

  for (const row of data ?? []) {
    const participants = toParticipants(row.participants);
    if (participants.length > 0) {
      return { playedOn: row.played_on, participants };
    }
  }
  return null;
}

/** 記録が1件でもあるか（初回の空状態の判定に使う） */
export async function getSessionCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("session")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

/**
 * 検索の対象にする記録。
 * 個人用アプリなので、新しいものから一定件数を読んで画面側で絞り込む。
 */
export async function getSearchPool(limit = 1000): Promise<SessionDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("*")
    .order("played_on", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toSessionDetail);
}

/** いちばん最近の「参加者がいる記録」のメンバー（日付の制限なし） */
export async function getLatestMembers(): Promise<PreviousMembers | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("played_on, sort_order, participants")
    .order("played_on", { ascending: false })
    .order("sort_order", { ascending: false })
    .limit(10);

  if (error) throw error;

  for (const row of data ?? []) {
    const participants = toParticipants(row.participants);
    if (participants.length > 0) {
      return { playedOn: row.played_on, participants };
    }
  }
  return null;
}

/** 最近遊んだゲーム（新しい順・重複なし） */
export async function getRecentGames(limit = 4): Promise<GameOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_detail")
    .select("game_id, game_title, played_on")
    .order("played_on", { ascending: false })
    .limit(60);

  if (error) throw error;

  const seen = new Set<string>();
  const games: GameOption[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.game_id)) continue;
    seen.add(row.game_id);
    games.push({ id: row.game_id, title: row.game_title });
    if (games.length >= limit) break;
  }
  return games;
}
