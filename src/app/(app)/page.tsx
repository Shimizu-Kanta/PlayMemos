import { getTags } from "@/lib/data/games";
import { getPeople } from "@/lib/data/people";
import {
  getSearchPool,
  getSessionCount,
  getSessionsInRange,
} from "@/lib/data/sessions";
import { currentMonth, isMonthString, monthRange } from "@/lib/date";

import { HomeView, type Filters } from "./home-view";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** "a,b,c" を配列にする（空要素と重複は落とす） */
function list(value: string | string[] | undefined): string[] {
  const raw = first(value);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))];
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  const requested = first(params.month);
  const month =
    requested && isMonthString(requested) ? requested : currentMonth();

  const query = (first(params.q) ?? "").trim();

  const filters: Filters = {
    tags: list(params.tags),
    personIds: list(params.people),
  };

  const { from, to } = monthRange(month);
  const [monthSessions, tags, people, total, searchPool] = await Promise.all([
    getSessionsInRange(from, to),
    getTags(),
    getPeople(),
    getSessionCount(),
    // 検索していないときは読まない
    query ? getSearchPool() : Promise.resolve([]),
  ]);

  // 友人チップは「最後に遊んだ順」に並べる
  const sortedPeople = [...people].sort((a, b) => {
    if (a.lastPlayedOn === b.lastPlayedOn) {
      return a.name.localeCompare(b.name, "ja");
    }
    if (!a.lastPlayedOn) return 1;
    if (!b.lastPlayedOn) return -1;
    return a.lastPlayedOn < b.lastPlayedOn ? 1 : -1;
  });

  return (
    <HomeView
      month={month}
      monthSessions={monthSessions}
      searchPool={searchPool}
      query={query}
      tags={tags}
      people={sortedPeople}
      initialFilters={filters}
      hasAnySession={total > 0}
    />
  );
}
