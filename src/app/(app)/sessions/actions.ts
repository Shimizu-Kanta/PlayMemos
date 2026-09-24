"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { describeError, fail, ok, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { isISODate } from "@/lib/date";
import { checkLength, trimmed } from "@/lib/validation";

/** 1日に登録できる行数の上限（誤操作で大量に送られるのを防ぐ） */
const MAX_ROWS_PER_DAY = 50;

export type RowInput = {
  /** 既存の記録を編集しているなら session.id、新規行なら null */
  sessionId: string | null;
  gameId: string;
  memo: string;
  participantIds: string[];
};

/** saveDay の戻り値。成功時は送った行と同じ順で session.id を返す */
export type SaveDayResult =
  | { ok: true; message: string; sessionIds: string[] }
  | { ok: false; message: string };

/** 選択肢をその場で作るアクションの戻り値 */
export type CreateResult =
  | { ok: true; id: string; label: string }
  | { ok: false; message: string };

/**
 * その日の記録を、送られてきた行の内容にまとめて揃える。
 *
 * PostgREST では複数の文をひとつのトランザクションにできないため、
 * 削除 → session の upsert → 参加者の貼り直し、の順に実行する。
 * 途中で失敗した場合はエラーを返すので、画面を開き直せば実際の状態が読み込まれる。
 */
export async function saveDay(
  date: string,
  rows: RowInput[],
): Promise<SaveDayResult> {
  if (!isISODate(date)) return fail("日付が正しくありません。");
  if (rows.length > MAX_ROWS_PER_DAY) {
    return fail(`1日に登録できる記録は${MAX_ROWS_PER_DAY}件までです。`);
  }
  if (rows.some((row) => !row.gameId)) {
    return fail("ゲームが選ばれていない行があります。");
  }

  const supabase = await createClient();

  const { data: existing, error: loadError } = await supabase
    .from("session")
    .select("id")
    .eq("played_on", date);
  if (loadError) return fail(describeError(loadError));

  const existingIds = new Set((existing ?? []).map((row) => row.id));

  const prepared = rows.map((row, index) => ({
    // 他所で消された記録を編集していた場合は新しい行として作り直す
    id:
      row.sessionId && existingIds.has(row.sessionId)
        ? row.sessionId
        : randomUUID(),
    played_on: date,
    game_id: row.gameId,
    sort_order: index,
    memo: trimmed(row.memo),
    participantIds: [...new Set(row.participantIds)],
  }));

  const keptIds = new Set(prepared.map((row) => row.id));
  const removedIds = [...existingIds].filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    const { error } = await supabase
      .from("session")
      .delete()
      .in("id", removedIds);
    if (error) return fail(describeError(error));
  }

  if (prepared.length > 0) {
    const { error } = await supabase.from("session").upsert(
      prepared.map((row) => ({
        id: row.id,
        played_on: row.played_on,
        game_id: row.game_id,
        sort_order: row.sort_order,
        memo: row.memo,
      })),
    );
    if (error) {
      return fail(
        describeError(error, {
          "23503":
            "選んだゲームが見つかりません。画面を再読み込みしてください。",
        }),
      );
    }

    // 参加者は毎回貼り直す（関係テーブルに他の情報を持たせていないため）
    const sessionIds = prepared.map((row) => row.id);
    const { error: clearError } = await supabase
      .from("session_person")
      .delete()
      .in("session_id", sessionIds);
    if (clearError) return fail(describeError(clearError));

    const pairs = prepared.flatMap((row) =>
      row.participantIds.map((personId) => ({
        session_id: row.id,
        person_id: personId,
      })),
    );
    if (pairs.length > 0) {
      const { error: insertError } = await supabase
        .from("session_person")
        .insert(pairs);
      if (insertError) {
        return fail(
          describeError(insertError, {
            "23503":
              "選んだ友人が見つかりません。画面を再読み込みしてください。",
          }),
        );
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/games");
  revalidatePath(`/sessions/${date}/edit`);
  return {
    ok: true,
    message: "保存しました。",
    sessionIds: prepared.map((row) => row.id),
  };
}

/** フォームからゲームをその場で作る（同名があればそれを使う） */
export async function findOrCreateGame(rawTitle: string): Promise<CreateResult> {
  const title = trimmed(rawTitle);
  if (!title) return { ok: false, message: "ゲーム名を入力してください。" };

  const lengthError = checkLength(title, 100, "ゲーム名");
  if (lengthError) return { ok: false, message: lengthError };

  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("game")
    .select("id, title")
    .eq("title", title)
    .maybeSingle();
  if (selectError) return { ok: false, message: describeError(selectError) };
  if (existing) return { ok: true, id: existing.id, label: existing.title };

  const { data: created, error } = await supabase
    .from("game")
    .insert({ title })
    .select("id, title")
    .single();
  if (error) return { ok: false, message: describeError(error) };

  revalidatePath("/games");
  return { ok: true, id: created.id, label: created.title };
}

/** フォームから友人をその場で登録する（同名があればそれを使う） */
export async function findOrCreatePerson(
  rawName: string,
): Promise<CreateResult> {
  const name = trimmed(rawName);
  if (!name) return { ok: false, message: "名前を入力してください。" };

  const lengthError = checkLength(name, 50, "名前");
  if (lengthError) return { ok: false, message: lengthError };

  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("person")
    .select("id, name")
    .eq("name", name)
    .limit(1)
    .maybeSingle();
  if (selectError) return { ok: false, message: describeError(selectError) };
  if (existing) return { ok: true, id: existing.id, label: existing.name };

  const { data: created, error } = await supabase
    .from("person")
    .insert({ name })
    .select("id, name")
    .single();
  if (error) return { ok: false, message: describeError(error) };

  revalidatePath("/people");
  return { ok: true, id: created.id, label: created.name };
}

export type QuickRowInput = {
  gameId: string;
  memo: string;
  participantIds: string[];
};

/**
 * クイック記録：その日の記録の後ろに追加する。
 * 既存の記録は触らないので、編集画面の saveDay とは別物。
 */
export async function appendSessions(
  date: string,
  rows: QuickRowInput[],
): Promise<ActionResult> {
  if (!isISODate(date)) return fail("日付が正しくありません。");
  if (rows.length === 0 || rows.some((row) => !row.gameId)) {
    return fail("ゲームを選んでください。");
  }
  if (rows.length > MAX_ROWS_PER_DAY) {
    return fail(`一度に登録できるのは${MAX_ROWS_PER_DAY}件までです。`);
  }

  const supabase = await createClient();

  const { data: last, error: loadError } = await supabase
    .from("session")
    .select("sort_order")
    .eq("played_on", date)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (loadError) return fail(describeError(loadError));

  const base = (last?.[0]?.sort_order ?? -1) + 1;

  const prepared = rows.map((row, index) => ({
    id: randomUUID(),
    played_on: date,
    game_id: row.gameId,
    sort_order: base + index,
    memo: trimmed(row.memo),
    participantIds: [...new Set(row.participantIds)],
  }));

  const { error: insertError } = await supabase.from("session").insert(
    prepared.map((row) => ({
      id: row.id,
      played_on: row.played_on,
      game_id: row.game_id,
      sort_order: row.sort_order,
      memo: row.memo,
    })),
  );
  if (insertError) {
    return fail(
      describeError(insertError, {
        "23503": "選んだゲームが見つかりません。画面を再読み込みしてください。",
      }),
    );
  }

  const pairs = prepared.flatMap((row) =>
    row.participantIds.map((personId) => ({
      session_id: row.id,
      person_id: personId,
    })),
  );
  if (pairs.length > 0) {
    const { error } = await supabase.from("session_person").insert(pairs);
    if (error) {
      return fail(
        describeError(error, {
          "23503": "選んだ友人が見つかりません。画面を再読み込みしてください。",
        }),
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/games");
  revalidatePath(`/sessions/${date}/edit`);
  return ok("記録しました。");
}
