/** 操作結果のメッセージ表示 */
export function ErrorMessage({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

/** データが無いときの案内 */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
