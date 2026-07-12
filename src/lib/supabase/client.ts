import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase browser client.
 *
 * This function is safe to call at the module level — it only initialises
 * the client when one of its methods is actually invoked. During SSR/static
 * generation (Vercel build), NEXT_PUBLIC_* env vars are not injected, so
 * calls will gracefully no-op if the URL/key are missing.
 *
 * Every call returns a *fresh* client so there is never a stale singleton.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // SSR/static generation — env vars aren't injected yet.
    // Return a mock client that gracefully no-ops instead of null,
    // so consumers never have to null-guard.
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({} as unknown as { data: { subscription: { unsubscribe: () => void } } }),
        updateUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            limit: async () => ({ data: [], error: null }),
          }),
          order: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
