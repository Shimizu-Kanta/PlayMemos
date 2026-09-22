import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

/** 未ログインでもアクセスできるパス */
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * リダイレクトしつつ、セッション更新で書き込まれた Cookie / ヘッダーを引き継ぐ。
 * これを忘れるとトークンのリフレッシュ結果が失われ、ログアウトが多発する。
 */
function redirect(
  request: NextRequest,
  pathname: string,
  base: NextResponse,
  searchParams?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(url);
  for (const cookie of base.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  base.headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith("x-middleware")) return;
    response.headers.set(key, value);
  });
  return response;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が未設定のときはここで落とさず、画面側でエラーを出させる
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // 認証 Cookie を含むレスポンスを CDN にキャッシュさせないためのヘッダー
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // セッションの更新はここで必ず行う（レスポンス生成前に呼ぶ必要がある）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    // ログイン後に元のページへ戻せるよう、アクセス先を控えておく
    const next = `${pathname}${request.nextUrl.search}`;
    return redirect(request, "/login", response, next === "/" ? {} : { next });
  }

  if (user && pathname === "/login") {
    return redirect(request, "/", response);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 静的ファイルと画像以外のすべてのリクエストで実行する
     */
    "/((?!_next/static|_next/image|favicon.ico|.*[.](?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
