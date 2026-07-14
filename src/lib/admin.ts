import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq } from "drizzle-orm";

/**
 * Check if a given user ID belongs to the store owner (admin).
 *
 * Uses the OWNER_EMAIL config value. This is a simple email-based
 * check suitable for single-admin stores. For multi-admin setups,
 * replace this with Supabase custom claims or an admin roles table.
 */
export async function checkAdmin(userId: string): Promise<boolean> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile?.email === config.ownerEmail;
}
