export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-12 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      <span className="sr-only">読み込み中</span>
    </div>
  );
}
