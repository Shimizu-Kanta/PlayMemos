import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

import { getSupabaseEnv } from "./env";

/** ブラウザ（Client Component）用の Supabase クライアント */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
