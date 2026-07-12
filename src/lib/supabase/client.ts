import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Create (or return cached) Supabase browser client.
 *
 * During server-side rendering / static generation (e.g. Vercel build),
 * env vars may not be available. Returns null instead of throwing,
 * so client components can safely import this at the module level.
 * Consumers must guard against null (e.g. in useEffect or event handlers).
 */
export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // SSR/static generation — env vars aren't injected yet.
    // The caller must handle this gracefully (null checks).
    return null;
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
