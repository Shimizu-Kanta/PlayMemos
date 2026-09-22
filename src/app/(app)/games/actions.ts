"use server";

import { revalidatePath } from "next/cache";

import { describeError, fail, ok, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { checkLength, trimmed } from "@/lib/validation";

const GAME_TITLE_MAX = 100;
const TAG_NAME_MAX = 50;

/** ゲーム名やタグ名の変更はカレンダーの表示にも影響する */
function revalidate() {
  revalidatePath("/games");
  revalidatePath("/");
}

/* ---------------- ゲーム ---------------- */

export async function createGame(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const title = trimmed(formData.get("title"));
  if (!title) return fail("ゲーム名を入力してください。");

  const lengthError = checkLength(title, GAME_TITLE_MAX, "ゲーム名");
  if (lengthError) return fail(lengthError);

  const supabase = await createClient();
  const { error } = await supabase.from("game").insert({ title });
  if (error) {
    return fail(
      describeError(error, { "23505": `「${title}」は既に登録されています。` }),
    );
  }

  revalidate();
  return ok(`「${title}」を追加しました。`);
}

export async function renameGame(
  id: string,
  rawTitle: string,
): Promise<ActionResult> {
  const title = trimmed(rawTitle);
  if (!title) return fail("ゲーム名を入力してください。");

  const lengthError = checkLength(title, GAME_TITLE_MAX, "ゲーム名");
  if (lengthError) return fail(lengthError);

  const supabase = await createClient();
  const { error } = await supabase.from("game").update({ title }).eq("id", id);
  if (error) {
    return fail(
      describeError(error, { "23505": `「${title}」は既に登録されています。` }),
    );
  }

  revalidate();
  return ok();
}

export async function deleteGame(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("game").delete().eq("id", id);
  if (error) {
    return fail(
      describeError(error, {
        // session.game_id は on delete restrict
        "23503":
          "このゲームを使っている記録があるため削除できません。先に記録を消してください。",
      }),
    );
  }

  revalidate();
  return ok();
}

/* ---------------- ゲームとタグの紐付け ---------------- */

export async function attachTag(
  gameId: string,
  tagId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("game_tag")
    .insert({ game_id: gameId, tag_id: tagId });
  if (error) {
    return fail(describeError(error, { "23505": "既に付いているタグです。" }));
  }

  revalidate();
  return ok();
}

export async function detachTag(
  gameId: string,
  tagId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("game_tag")
    .delete()
    .eq("game_id", gameId)
    .eq("tag_id", tagId);
  if (error) return fail(describeError(error));

  revalidate();
  return ok();
}

/** タグをその場で作ってゲームに付ける */
export async function createTagAndAttach(
  gameId: string,
  rawName: string,
): Promise<ActionResult> {
  const name = trimmed(rawName);
  if (!name) return fail("タグ名を入力してください。");

  const lengthError = checkLength(name, TAG_NAME_MAX, "タグ名");
  if (lengthError) return fail(lengthError);

  const supabase = await createClient();

  // 同名のタグが既にあればそれを使い回す
  const { data: existing, error: selectError } = await supabase
    .from("tag")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (selectError) return fail(describeError(selectError));

  let tagId = existing?.id;
  if (!tagId) {
    const { data: created, error: insertError } = await supabase
      .from("tag")
      .insert({ name })
      .select("id")
      .single();
    if (insertError) return fail(describeError(insertError));
    tagId = created.id;
  }

  const { error } = await supabase
    .from("game_tag")
    .insert({ game_id: gameId, tag_id: tagId });
  if (error) {
    return fail(describeError(error, { "23505": "既に付いているタグです。" }));
  }

  revalidate();
  return ok();
}

/* ---------------- タグ ---------------- */

export async function createTag(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = trimmed(formData.get("name"));
  if (!name) return fail("タグ名を入力してください。");

  const lengthError = checkLength(name, TAG_NAME_MAX, "タグ名");
  if (lengthError) return fail(lengthError);

  const supabase = await createClient();
  const { error } = await supabase.from("tag").insert({ name });
  if (error) {
    return fail(
      describeError(error, { "23505": `「${name}」は既に登録されています。` }),
    );
  }

  revalidate();
  return ok(`「${name}」を追加しました。`);
}

export async function renameTag(
  id: string,
  rawName: string,
): Promise<ActionResult> {
  const name = trimmed(rawName);
  if (!name) return fail("タグ名を入力してください。");

  const lengthError = checkLength(name, TAG_NAME_MAX, "タグ名");
  if (lengthError) return fail(lengthError);

  const supabase = await createClient();
  const { error } = await supabase.from("tag").update({ name }).eq("id", id);
  if (error) {
    return fail(
      describeError(error, { "23505": `「${name}」は既に登録されています。` }),
    );
  }

  revalidate();
  return ok();
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  // game_tag は on delete cascade なので、付いているゲームからは自動で外れる
  const { error } = await supabase.from("tag").delete().eq("id", id);
  if (error) return fail(describeError(error));

  revalidate();
  return ok();
}
