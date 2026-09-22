"use client";

import { useMemo, useState } from "react";

import { Input } from "./ui/input";

export type Option = { id: string; label: string };

const MAX_SUGGESTIONS = 20;

type Props = {
  placeholder: string;
  options: Option[];
  /** 既に選ばれていて候補から除きたいID */
  excludeIds?: Set<string>;
  disabled?: boolean;
  /** 「〇〇を新規作成」の文言 */
  createLabel: (query: string) => string;
  onSelect: (option: Option) => void;
  onCreate: (name: string) => void;
  /** 複数選択のときは選んだ後も開いたままにする */
  keepOpenAfterSelect?: boolean;
};

/** 検索して選ぶ / その場で新規作成する共通の入力欄 */
export function SearchDropdown({
  placeholder,
  options,
  excludeIds,
  disabled,
  createLabel,
  onSelect,
  onCreate,
  keepOpenAfterSelect = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const q = query.trim();

  const suggestions = useMemo(() => {
    const base = excludeIds
      ? options.filter((o) => !excludeIds.has(o.id))
      : options;
    if (!q) return base.slice(0, MAX_SUGGESTIONS);
    const needle = q.toLowerCase();
    return base
      .filter((o) => o.label.toLowerCase().includes(needle))
      .slice(0, MAX_SUGGESTIONS);
  }, [options, excludeIds, q]);

  // 同じ名前が既にあるなら「新規作成」は出さない
  const canCreate = q.length > 0 && !options.some((o) => o.label === q);

  function choose(option: Option) {
    onSelect(option);
    setQuery("");
    if (!keepOpenAfterSelect) setOpen(false);
  }

  function create() {
    onCreate(q);
    setQuery("");
    if (!keepOpenAfterSelect) setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // 候補は onMouseDown で確定するので、blur で閉じて問題ない
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions.length > 0) choose(suggestions[0]);
            else if (canCreate) create();
          }
        }}
      />

      {open && (suggestions.length > 0 || canCreate) ? (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
                className="block w-full truncate px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                {option.label}
              </button>
            </li>
          ))}
          {canCreate ? (
            <li className={suggestions.length > 0 ? "border-t border-slate-100" : ""}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  create();
                }}
                className="block w-full truncate px-3 py-1.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                {createLabel(q)}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
