import { redirect } from "next/navigation";

import { isISODate, todayISO } from "@/lib/date";

/**
 * 記録の入り口。
 * 実体は日付ごとの編集画面なので、日付を決めてそちらへ送る。
 */
export default async function NewSessionPage({
  searchParams,
}: PageProps<"/sessions/new">) {
  const params = await searchParams;
  const raw = Array.isArray(params.date) ? params.date[0] : params.date;
  const date = typeof raw === "string" && isISODate(raw) ? raw : todayISO();

  redirect(`/sessions/${date}/edit`);
}
