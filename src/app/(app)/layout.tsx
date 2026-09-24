import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppHeader, BottomTabBar } from "@/components/app-header";
import { getCurrentUser } from "@/lib/supabase/server";

/** Discord のプロフィールから表示名とアイコンを取り出す */
function profileOf(metadata: Record<string, unknown>, fallback: string) {
  const pick = (key: string) => {
    const value = metadata[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  return {
    displayName:
      pick("full_name") ?? pick("name") ?? pick("user_name") ?? fallback,
    avatarUrl: pick("avatar_url") ?? pick("picture"),
  };
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // proxy.ts でもガードしているが、念のためここでも確認する
  if (!user) redirect("/login");

  const { displayName, avatarUrl } = profileOf(
    user.user_metadata ?? {},
    user.email ?? "ユーザー",
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader displayName={displayName} avatarUrl={avatarUrl} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(96px+env(safe-area-inset-bottom,0px))] lg:px-8 lg:pb-8">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
