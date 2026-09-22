import type { Metadata } from "next";

import { DiscordLoginButton } from "./discord-login-button";

export const metadata: Metadata = {
  title: "ログイン",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** オープンリダイレクトを避けるため、自サイト内の絶対パスだけ許可する */
function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(firstValue(params.next));
  const error = firstValue(params.error);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            PlayMemos
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            いつ・誰と・何を遊んだかを記録する
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            ログインに失敗しました：{error}
          </p>
        ) : null}

        <DiscordLoginButton next={next} />
      </div>
    </main>
  );
}
