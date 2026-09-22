"use server";

import { revalidatePath } from "next/cache";

import { describeError, fail, ok, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { checkDiscordId, checkLength, trimmed } from "@/lib/validation";

const NAME_MAX = 50;

function revalidate() {
  revalidatePath("/people");
  revalidatePath("/");
}

export async function createPerson(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = trimmed(formData.get("name"));
  if (!name) return fail("名前を入力してください。");

  const lengthError = checkLength(name, NAME_MAX, "名前");
  if (lengthError) return fail(lengthError);

  const discordId = trimmed(formData.get("discord_id"));
  if (discordId) {
    const discordError = checkDiscordId(discordId);
    if (discordError) return fail(discordError);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("person")
    .insert({ name, discord_id: discordId });
  if (error) {
    return fail(
      describeError(error, {
        "23505": "その Discord ID の友人は既に登録されています。",
      }),
    );
  }

  revalidate();
  return ok(`${name} さんを追加しました。`);
}

/** 詳細ページからの編集（名前・Discord ID・メモ） */
export async function updatePerson(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = trimmed(formData.get("name"));
  if (!name) return fail("名前を入力してください。");

  const lengthError = checkLength(name, NAME_MAX, "名前");
  if (lengthError) return fail(lengthError);

  const discordId = trimmed(formData.get("discord_id"));
  if (discordId) {
    const discordError = checkDiscordId(discordId);
    if (discordError) return fail(discordError);
  }

  const memo = trimmed(formData.get("memo"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("person")
    .update({ name, discord_id: discordId, memo })
    .eq("id", id);
  if (error) {
    return fail(
      describeError(error, {
        "23505": "その Discord ID の友人は既に登録されています。",
      }),
    );
  }

  revalidate();
  revalidatePath(`/people/${id}`);
  return ok("保存しました。");
}

export async function deletePerson(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  // session_person は on delete cascade なので、記録からも参加者が外れる
  const { error } = await supabase.from("person").delete().eq("id", id);
  if (error) return fail(describeError(error));

  revalidate();
  return ok();
}
