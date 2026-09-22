import { getTags } from "@/lib/data/games";
import { getGameOptions, getPersonOptions, getSessionsInRange } from "@/lib/data/sessions";
import { currentMonth, isMonthString, monthRange } from "@/lib/date";

import { CalendarView, type Filters } from "./calendar-view";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** "a,b,c" を配列にする（空要素と重複は落とす） */
function list(value: string | string[] | undefined): string[] {
  const raw = first(value);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))];
}

export default async function CalendarPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  const requested = first(params.month);
  const month =
    requested && isMonthString(requested) ? requested : currentMonth();

  const filters: Filters = {
    tags: list(params.tags),
    gameIds: list(params.games),
    personIds: list(params.people),
  };

  const { from, to } = monthRange(month);
  const [sessions, tags, games, people] = await Promise.all([
    getSessionsInRange(from, to),
    getTags(),
    getGameOptions(),
    getPersonOptions(),
  ]);

  return (
    <CalendarView
      month={month}
      sessions={sessions}
      tags={tags}
      games={games}
      people={people}
      initialFilters={filters}
    />
  );
}
