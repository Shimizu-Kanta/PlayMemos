import { getTags } from "@/lib/data/games";
import { byLastPlayed, getPeople } from "@/lib/data/people";
import {
  getGameOptions,
  getLatestMembers,
  getRecentGames,
  getSearchPool,
  getSessionCount,
  getSessionsInRange,
} from "@/lib/data/sessions";
import {
  currentMonth,
  isISODate,
  isMonthString,
  monthRange,
  todayISO,
} from "@/lib/date";

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

  // ?record=1 で今日、?record=YYYY-MM-DD でその日の記録シートを開く
  const record = first(params.record);
  const recordOpen = Boolean(record);
  const recordDate = record && isISODate(record) ? record : todayISO();

  const { from, to } = monthRange(month);
  const [monthSessions, tags, people, total, searchPool] = await Promise.all([
    getSessionsInRange(from, to),
    getTags(),
    getPeople(),
    getSessionCount(),
    // 検索していないときは読まない
    query ? getSearchPool() : Promise.resolve([]),
  ]);

  // 記録シートを開くときだけ、その入力に必要なものを読む
  const [games, recentGames, latestMembers] = recordOpen
    ? await Promise.all([
        getGameOptions(),
        getRecentGames(),
        getLatestMembers(),
      ])
    : [[], [], null];

  // 友人チップは「最後に遊んだ順」に並べる
  const sortedPeople = [...people].sort(byLastPlayed);

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
      recordOpen={recordOpen}
      recordDate={recordDate}
      games={games}
      recentGames={recentGames}
      latestMembers={latestMembers}
    />
  );
}
