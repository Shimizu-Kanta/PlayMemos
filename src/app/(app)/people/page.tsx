import type { Metadata } from "next";

import { getPeople } from "@/lib/data/people";

import { PersonList } from "./person-list";

export const metadata: Metadata = {
  title: "友人",
};

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">友人</h1>
        <p className="mt-1 text-sm text-slate-500">
          名前はクリックすると編集できます。Discord ID とメモの編集はフェーズ5の詳細ページで対応します。
        </p>
      </div>

      <PersonList people={people} />
    </div>
  );
}
