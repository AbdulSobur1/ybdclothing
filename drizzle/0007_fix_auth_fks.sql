-- Fix: Drizzle's pgTable("auth.users") creates FK constraints pointing to
-- "public"."auth.users" (a table in the public schema). But Supabase manages
-- the real "users" table in the "auth" schema. This migration drops the
-- broken constraints and creates proper ones referencing "auth"."users".
-->
--> statement-breakpoint
-- Drop broken FK constraints that point to public.auth.users (or were misnamed)
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_id_auth.users_id_fk";
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_id_users_fk";
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_user_id_auth.users_id_fk";
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_user_id_users_fk";
ALTER TABLE "wishlist_items" DROP CONSTRAINT IF EXISTS "wishlist_items_user_id_auth.users_id_fk";
ALTER TABLE "wishlist_items" DROP CONSTRAINT IF EXISTS "wishlist_items_user_id_users_fk";
ALTER TABLE "waitlist_entries" DROP CONSTRAINT IF EXISTS "waitlist_entries_user_id_auth.users_id_fk";
ALTER TABLE "waitlist_entries" DROP CONSTRAINT IF EXISTS "waitlist_entries_user_id_users_fk";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_user_id_auth.users_id_fk";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_user_id_users_fk";
ALTER TABLE "order_notes" DROP CONSTRAINT IF EXISTS "order_notes_created_by_auth.users_id_fk";
ALTER TABLE "order_notes" DROP CONSTRAINT IF EXISTS "order_notes_created_by_users_fk";
-->
--> statement-breakpoint
-- Create proper FK constraints referencing the real Supabase auth.users table
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_auth_users_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_auth_users_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_auth_users_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_auth_users_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_created_by_auth_users_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
-->
--> statement-breakpoint
-- Clean up: drop the incorrectly created public.auth.users table if it exists
DROP TABLE IF EXISTS "auth.users";
