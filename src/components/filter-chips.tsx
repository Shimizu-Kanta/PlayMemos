"use client";

export type ChipOption = { value: string; label: string; hint?: string };

type Props = {
  legend: string;
  options: ChipOption[];
  selected: string[];
  emptyText: string;
  onToggle: (value: string) => void;
};

/** 複数選択できるトグルチップの並び */
export function FilterChips({
  legend,
  options,
  selected,
  emptyText,
  onToggle,
}: Props) {
  const selectedSet = new Set(selected);

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-medium text-slate-500">
        {legend}
        {selected.length > 0 ? (
          <span className="ml-1 text-slate-900">({selected.length})</span>
        ) : null}
      </legend>

      {options.length === 0 ? (
        <p className="text-xs text-slate-400">{emptyText}</p>
      ) : (
        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
          {options.map((option) => {
            const on = selectedSet.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={on}
                title={option.hint}
                onClick={() => onToggle(option.value)}
                className={
                  on
                    ? "rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-slate-400"
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
