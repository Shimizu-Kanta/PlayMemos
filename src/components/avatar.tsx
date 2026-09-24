/**
 * 名前の頭文字で表示するアイコンと、その人の色。
 * Discord のアイコン取得は MVP の対象外なので、当面はこれを使う。
 *
 * Tailwind はクラス名を静的に読み取るので、色は必ずここに並べた文字列から選ぶこと。
 */
export type PersonPalette = {
  /** アバターの塗り（100 系）と文字（700 系） */
  avatar: string;
  /** 面で塗るとき（100 系） */
  surface: string;
  /** 文字（700 系） */
  text: string;
  /** ドットなど小さい塗り（700 系） */
  dot: string;
  /** 枠線（700 系） */
  border: string;
};

const PALETTE: PersonPalette[] = [
  {
    avatar: "bg-rose-100 text-rose-700",
    surface: "bg-rose-100",
    text: "text-rose-700",
    dot: "bg-rose-700",
    border: "border-rose-700",
  },
  {
    avatar: "bg-amber-100 text-amber-700",
    surface: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-700",
    border: "border-amber-700",
  },
  {
    avatar: "bg-emerald-100 text-emerald-700",
    surface: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-700",
    border: "border-emerald-700",
  },
  {
    avatar: "bg-sky-100 text-sky-700",
    surface: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-700",
    border: "border-sky-700",
  },
  {
    avatar: "bg-violet-100 text-violet-700",
    surface: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-700",
    border: "border-violet-700",
  },
  {
    avatar: "bg-teal-100 text-teal-700",
    surface: "bg-teal-100",
    text: "text-teal-700",
    dot: "bg-teal-700",
    border: "border-teal-700",
  },
];

/** 名前から色を決める（同じ名前なら必ず同じ色） */
export function personPalette(name: string): PersonPalette {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000003;
  }
  return PALETTE[hash % PALETTE.length];
}

/** サロゲートペア（絵文字など）でも壊れないように1文字取り出す */
export function initialOf(name: string) {
  return [...name][0] ?? "?";
}

export function InitialAvatar({
  name,
  className = "size-8 text-xs",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${personPalette(name).avatar} ${className}`}
    >
      {initialOf(name)}
    </span>
  );
}
