-- Drop waitlist_entries table and its partial unique indexes.
-- The waitlist feature is being replaced by wishlist.
--> statement-breakpoint
DROP INDEX IF EXISTS "waitlist_unique_with_variant";
--> statement-breakpoint
DROP INDEX IF EXISTS "waitlist_unique_without_variant";
--> statement-breakpoint
-- Drop FK constraints first, then the table
ALTER TABLE IF EXISTS "waitlist_entries" DROP CONSTRAINT IF EXISTS "waitlist_entries_user_id_auth_users_fk";
ALTER TABLE IF EXISTS "waitlist_entries" DROP CONSTRAINT IF EXISTS "waitlist_entries_user_id_users_fk";
ALTER TABLE IF EXISTS "waitlist_entries" DROP CONSTRAINT IF EXISTS "waitlist_entries_product_id_products_id_fk";
ALTER TABLE IF EXISTS "waitlist_entries" DROP CONSTRAINT IF EXISTS "waitlist_entries_variant_id_product_variants_id_fk";
--> statement-breakpoint
DROP TABLE IF EXISTS "waitlist_entries";
