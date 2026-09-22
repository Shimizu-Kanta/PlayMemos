/**
 * Supabase の環境変数をまとめて取り出す。
 * NEXT_PUBLIC_* はビルド時にインライン展開されるため、ブラウザ側でも参照できる。
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase の環境変数が設定されていません。`.env.example` を参考に `.env.local` へ " +
        "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。",
    );
  }

  return { url, anonKey };
}
