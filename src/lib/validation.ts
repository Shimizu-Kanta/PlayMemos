/** 前後の空白を落として、空文字なら null を返す */
export function trimmed(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** 文字数の上限・下限（DB の check 制約と同じ条件） */
export function checkLength(value: string, max: number, label: string) {
  if (value.length > max) return `${label}は${max}文字以内で入力してください。`;
  return null;
}

/** Discord のユーザーID（17〜20桁の数字）。DB の check 制約と同じ条件 */
export function checkDiscordId(value: string) {
  return /^[0-9]{17,20}$/.test(value)
    ? null
    : "Discord ID は17〜20桁の数字で入力してください。";
}
