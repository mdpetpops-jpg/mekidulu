/**
 * Server-only Supabase client.
 *
 * Uses the service_role key, which bypasses Row Level Security. Never import
 * this module from a Client Component: it must only be reached from Route
 * Handlers, Server Actions or Server Components that never ship to the browser.
 *
 * NOTE: the Vercel environment variable is named `SUPABASE_SERVICE_ROLE_KEY1`
 * (trailing "1"). The name is exact — do not "fix" it.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConfigError extends Error {
  readonly missing: readonly string[];

  constructor(missing: readonly string[]) {
    super(`Missing Supabase environment variable(s): ${missing.join(", ")}`);
    this.name = "SupabaseConfigError";
    this.missing = missing;
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedKey: string | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY1?.trim();

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY1");
  if (!url || !serviceRoleKey) {
    throw new SupabaseConfigError(missing);
  }

  // Reuse the client across warm serverless invocations.
  if (cachedClient && cachedKey === serviceRoleKey) {
    return cachedClient;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "X-Client-Info": "mekidulu-web/1.0" },
    },
  });
  cachedKey = serviceRoleKey;

  return cachedClient;
}
