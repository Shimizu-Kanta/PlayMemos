/**
 * 名前の頭文字で表示するアイコン。
 * Discord のアイコン取得は MVP の対象外なので、当面はこれを使う。
 */
const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

function colorOf(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return PALETTE[hash % PALETTE.length];
}

export function InitialAvatar({
  name,
  className = "size-8 text-xs",
}: {
  name: string;
  className?: string;
}) {
  // サロゲートペア（絵文字など）でも壊れないように1文字取り出す
  const initial = [...name][0] ?? "?";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${colorOf(name)} ${className}`}
    >
      {initial}
    </span>
  );
}
