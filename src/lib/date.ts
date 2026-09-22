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

/** 今日の日付（ローカル時刻基準） */
export function todayISO() {
  return toISODate(new Date());
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
