import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * The browser's Supabase client, used for sign-in only (data goes through the API). It keeps the
 * session in localStorage and refreshes the access token before it expires.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // The "anon" / "publishable" key: safe in the browser, it only allows what Supabase Auth allows.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Sign-in isn't set up yet (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing).");
  }

  client = createClient(url, key, {
    auth: {
      // Email links and social logins come back with ?code=, which the callback pages exchange
      // themselves so it happens exactly once.
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

/** The current access token, or null when signed out. */
export async function currentAccessToken() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}
