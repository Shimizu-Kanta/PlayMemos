"use client";

import { useState, type FormEvent } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { signOut } from "@/app/auth/actions";

export const NAV_ITEMS = [
  { href: "/", label: "記録" },
  { href: "/people", label: "友人" },
  { href: "/games", label: "ゲーム" },
] as const;

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/sessions");
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  displayName: string;
  avatarUrl: string | null;
};

export function AppHeader({ displayName, avatarUrl }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  // 検索欄は非制御にして、key で現在の検索語に合わせる
  const query = searchParams.get("q") ?? "";

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = new FormData(event.currentTarget).get("q");
    const next = typeof raw === "string" ? raw.trim() : "";
    setMenuOpen(false);
    router.push(next ? `/?q=${encodeURIComponent(next)}` : "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 lg:gap-4 lg:px-8 lg:py-3.5">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900"
        >
          PlayMemos
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <form className="hidden lg:block" role="search" onSubmit={handleSearch}>
            <input
              key={`pc-${query}`}
              type="search"
              name="q"
              defaultValue={query}
              placeholder="人・ゲームで検索"
              aria-label="人・ゲームで検索"
              className="w-60 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.75 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
            />
          </form>

          <Link
            href="/?record=1"
            className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 lg:inline-block"
          >
            ＋ 記録する
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="アカウント"
              onClick={() => setMenuOpen((v) => !v)}
              className="block rounded-full"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full bg-slate-200"
                  unoptimized
                />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                  {[...displayName][0] ?? "?"}
                </span>
              )}
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="メニューを閉じる"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute top-full right-0 z-50 mt-1.5 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                >
                  <p className="truncate px-3 py-2 text-xs text-slate-500">
                    {displayName}
                  </p>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      ログアウト
                    </button>
                  </form>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* スマホはヘッダーに検索欄を出す余裕がないので、2段目に置く */}
      <form role="search" onSubmit={handleSearch} className="px-4 pb-3 lg:hidden">
        <input
          key={`sp-${query}`}
          type="search"
          name="q"
          defaultValue={query}
          placeholder="人・ゲームで検索"
          aria-label="人・ゲームで検索"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
        />
      </form>
    </header>
  );
}

/** スマホ用の下タブバー */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-center text-xs font-semibold lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-slate-900" : "text-slate-400"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
