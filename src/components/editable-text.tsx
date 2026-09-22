"use client";

import { useState } from "react";

import type { ActionResult } from "@/lib/errors";

import { useActionRunner } from "./use-action-runner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ErrorMessage } from "./ui/message";

type Props = {
  value: string;
  maxLength: number;
  ariaLabel: string;
  /** 表示モードの文字装飾 */
  className?: string;
  onSave: (next: string) => Promise<ActionResult>;
};

/** クリックでその場編集できるテキスト */
export function EditableText({
  value,
  maxLength,
  ariaLabel,
  className = "",
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const { pending, error, setError, run } = useActionRunner();

  function startEditing() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setError(null);
    setEditing(false);
  }

  function save() {
    if (draft.trim() === value) {
      cancel();
      return;
    }
    run(() => onSave(draft), () => setEditing(false));
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        aria-label={`${ariaLabel}を変更`}
        className={`rounded text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${className}`}
      >
        {value}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={draft}
          maxLength={maxLength}
          aria-label={ariaLabel}
          disabled={pending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") cancel();
          }}
        />
        <Button variant="primary" size="sm" onClick={save} disabled={pending}>
          保存
        </Button>
        <Button size="sm" onClick={cancel} disabled={pending}>
          やめる
        </Button>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
    </div>
  );
}
