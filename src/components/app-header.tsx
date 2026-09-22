"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/auth/actions";

const NAV_ITEMS = [
  { href: "/", label: "カレンダー" },
  { href: "/games", label: "ゲーム" },
  { href: "/people", label: "友人" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  displayName: string;
  avatarUrl: string | null;
};

export function AppHeader({ displayName, avatarUrl }: Props) {
  const pathname = usePathname();

  const navLinks = NAV_ITEMS.map((item) => {
    const active = isActive(pathname, item.href);
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
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900"
        >
          PlayMemos
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">{navLinks}</nav>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full bg-slate-200"
                unoptimized
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
              >
                {displayName.slice(0, 1)}
              </span>
            )}
            <span className="hidden max-w-32 truncate text-sm text-slate-600 md:inline">
              {displayName}
            </span>
          </span>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 px-4 py-2 sm:hidden">
        {navLinks}
      </nav>
    </header>
  );
}
