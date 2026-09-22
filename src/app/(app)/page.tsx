import Link from "next/link";

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">カレンダー</h1>
        <Link
          href="/sessions/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          記録する
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        カレンダー表示はフェーズ4で実装します。
      </div>
    </div>
  );
}
