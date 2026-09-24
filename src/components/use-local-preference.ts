"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * localStorage に覚えておく表示設定。
 *
 * サーバー描画とハイドレーションのあいだは既定値を返すので、
 * 画面がちらついたり、ハイドレーションがずれたりしない。
 * `allowed` はモジュールの定数など、毎回同じ配列を渡すこと。
 */
export function useLocalPreference<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (value: T) => void] {
  const getSnapshot = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null && (allowed as readonly string[]).includes(stored)
        ? (stored as T)
        : fallback;
    } catch {
      // プライベートウィンドウなどで読めなくても既定値で動く
      return fallback;
    }
  }, [key, fallback, allowed]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // 保存できなくても、この場の表示は切り替わってほしいので通知はする
      }
      for (const onChange of listeners) onChange();
    },
    [key],
  );

  return [value, setValue];
}
