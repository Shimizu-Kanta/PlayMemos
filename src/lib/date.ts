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

/* ---------- 月（"YYYY-MM"）の扱い ---------- */

/** "YYYY-MM" として成立するか */
export function isMonthString(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** "2026-09-23" → "2026-09" */
export function monthOf(iso: string) {
  return iso.slice(0, 7);
}

/** 今月（APP_TIME_ZONE 基準） */
export function currentMonth() {
  return monthOf(todayISO());
}

/** "2026-09" を n ヶ月ずらす */
export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * その月のカレンダーに映る日付の範囲。
 * 月表示は前後の月のマスも出るので、少し広めに取る。
 */
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // 月末
  start.setDate(start.getDate() - 7);
  end.setDate(end.getDate() + 7);
  return { from: toISODate(start), to: toISODate(end) };
}

/** "2026-09" → "2026年9月" */
export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${y}年${m}月`;
}
