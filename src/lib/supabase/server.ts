import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

import { getSupabaseEnv } from "./env";

/**
 * サーバー（Server Component / Server Action / Route Handler）用の Supabase クライアント。
 * リクエストごとに必ず新しく生成すること。
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは Cookie を書き込めない。
          // セッションの更新は proxy.ts 側で行っているのでここでは無視してよい。
        }
      },
    },
  });
}

/** ログイン中のユーザーを返す（未ログインなら null） */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
