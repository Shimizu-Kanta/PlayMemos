import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-lg font-bold">ページが見つかりません</h1>
      <p className="text-sm text-slate-600">
        削除されたか、URL が違っているかもしれません。
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        カレンダーへ戻る
      </Link>
    </div>
  );
}
