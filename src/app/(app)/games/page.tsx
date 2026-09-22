import type { Metadata } from "next";

import { getGames, getTags } from "@/lib/data/games";

import { GameList } from "./game-list";
import { TagList } from "./tag-list";

export const metadata: Metadata = {
  title: "ゲーム・タグ",
};

export default async function GamesPage() {
  const [games, tags] = await Promise.all([getGames(), getTags()]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">ゲーム・タグ</h1>
        <p className="mt-1 text-sm text-slate-500">
          ゲーム名はクリックすると編集できます。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <GameList games={games} tags={tags} />
        <TagList tags={tags} />
      </div>
    </div>
  );
}
