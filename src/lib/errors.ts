import type { PostgrestError } from "@supabase/supabase-js";

/** Server Action の戻り値 */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

// 戻り値の型を広げすぎないことで、呼び出し側で成否を絞り込めるようにする
export const ok = (message?: string): { ok: true; message?: string } => ({
  ok: true,
  message,
});
export const fail = (message: string): { ok: false; message: string } => ({
  ok: false,
  message,
});

/** PostgreSQL のエラーコードを日本語のメッセージに変換する */
export function describeError(
  error: PostgrestError,
  overrides: Partial<Record<string, string>> = {},
): string {
  const code = error.code ?? "";
  const override = overrides[code];
  if (override) return override;

  switch (code) {
    case "23505": // unique_violation
      return "同じ名前のものが既に登録されています。";
    case "23503": // foreign_key_violation
      return "他のデータから参照されているため、この操作はできません。";
    case "23514": // check_violation
      return "入力内容が条件を満たしていません。文字数を確認してください。";
    case "42501": // insufficient_privilege
      return "権限がありません。ログインし直してください。";
    default:
      return `エラーが発生しました（${code || "不明"}）。時間をおいて試してください。`;
  }
}
