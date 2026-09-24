import type { Metadata } from "next";

import { byLastPlayed, getPeople } from "@/lib/data/people";

import { PersonList } from "./person-list";

export const metadata: Metadata = {
  title: "友人",
};

export default async function PeoplePage() {
  const people = await getPeople();

  // 最後に遊んだ日が新しい順
  return <PersonList people={[...people].sort(byLastPlayed)} />;
}
