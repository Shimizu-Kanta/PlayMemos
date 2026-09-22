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
          名前をクリックすると、Discord ID ・メモの編集と一緒に遊んだ記録を見られます。
        </p>
      </div>

      <PersonList people={people} />
    </div>
  );
}
