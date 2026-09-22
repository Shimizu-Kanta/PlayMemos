"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-lg font-bold">表示できませんでした</h1>
      <p className="text-sm text-slate-600">
        データの読み込みに失敗しました。通信を確認して、もう一度お試しください。
      </p>
      {error.digest ? (
        <p className="text-xs text-slate-400">エラーID: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        もう一度読み込む
      </button>
    </div>
  );
}
