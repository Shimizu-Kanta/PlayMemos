import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** オープンリダイレクトを避けるため、自サイト内の絶対パスだけ許可する */
function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/** ローカル以外（Vercel など）ではプロキシ経由のホスト名を使う */
function getBaseUrl(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (process.env.NODE_ENV !== "production") return origin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return origin;

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${forwardedHost}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const baseUrl = getBaseUrl(request);

  const loginWithError = (message: string) =>
    NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(message)}`,
    );

  // Discord 側 / Supabase 側でエラーになった場合
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) return loginWithError(oauthError);

  const code = searchParams.get("code");
  if (!code) return loginWithError("認証コードが取得できませんでした。");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginWithError(error.message);

  return NextResponse.redirect(`${baseUrl}${safeNext(searchParams.get("next"))}`);
}
