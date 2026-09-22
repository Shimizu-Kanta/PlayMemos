const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** "YYYY-MM-DD" をローカル時刻の Date にする（UTC 解釈による日付ズレを避ける） */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Date を "YYYY-MM-DD" にする（ローカル時刻基準） */
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * このアプリが「今日」を決めるときのタイムゾーン。
 * Vercel など UTC のサーバーで動いても日付がずれないように固定する。
 */
export const APP_TIME_ZONE = "Asia/Tokyo";

/** 今日の日付（APP_TIME_ZONE 基準） */
export function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "YYYY-MM-DD" として成立するか（存在しない日付も弾く） */
export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISODate(parseISODate(value)) === value;
}

/** "2026-09-23" → "2026/9/23" */
export function formatDate(iso: string) {
  const d = parseISODate(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** "2026-09-23" → "2026年9月23日(火)" */
export function formatDateLong(iso: string) {
  const d = parseISODate(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`;
}
