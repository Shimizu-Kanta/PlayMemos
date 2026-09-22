"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@/lib/errors";

/**
 * ボタン操作から Server Action を呼ぶための共通処理。
 * 実行中フラグとエラーメッセージをまとめて面倒を見る。
 */
export function useActionRunner() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    });
  }

  return { pending, error, setError, run };
}
