import { createClient } from "@/lib/supabase/server";

export type TagRef = { id: string; name: string };

export type GameWithTags = {
  id: string;
  title: string;
  tags: TagRef[];
  /** この ゲーム を使っている記録の件数。0 のときだけ削除できる */
  sessionCount: number;
};

export type TagWithUsage = TagRef & {
  /** このタグが付いているゲームの数 */
  gameCount: number;
};

/** 日本語を含む名前の並び替え */
export const byName = (a: string, b: string) => a.localeCompare(b, "ja");

export async function getGames(): Promise<GameWithTags[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game")
    .select("id, title, game_tag(tag(id, name)), session(count)");

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      title: row.title,
      tags: (row.game_tag ?? [])
        .flatMap((gt) => (gt.tag ? [gt.tag] : []))
        .sort((a, b) => byName(a.name, b.name)),
      sessionCount: row.session?.[0]?.count ?? 0,
    }))
    .sort((a, b) => byName(a.title, b.title));
}

export async function getTags(): Promise<TagWithUsage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tag")
    .select("id, name, game_tag(count)");

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      gameCount: row.game_tag?.[0]?.count ?? 0,
    }))
    .sort((a, b) => byName(a.name, b.name));
}

/** ゲーム1件をタグ・記録件数つきで取得する（見つからなければ null） */
export async function getGame(id: string): Promise<GameWithTags | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game")
    .select("id, title, game_tag(tag(id, name)), session(count)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    tags: (data.game_tag ?? [])
      .flatMap((gt) => (gt.tag ? [gt.tag] : []))
      .sort((a, b) => byName(a.name, b.name)),
    sessionCount: data.session?.[0]?.count ?? 0,
  };
}
