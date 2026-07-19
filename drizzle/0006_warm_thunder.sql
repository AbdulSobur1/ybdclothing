-- Fix: PostgreSQL UNIQUE constraint treats NULLs as distinct, so
-- (user_id, product_id, NULL) duplicates are NOT prevented.
-- Replace with partial unique indexes that handle NULL variantId correctly.
--> statement-breakpoint
ALTER TABLE "waitlist_entries" DROP CONSTRAINT "waitlist_entries_user_id_product_id_variant_id_unique";
--> statement-breakpoint
-- Partial unique index: when variantId IS NOT NULL, enforce uniqueness on all three columns
CREATE UNIQUE INDEX "waitlist_unique_with_variant" ON "waitlist_entries" ("user_id", "product_id", "variant_id") WHERE "variant_id" IS NOT NULL;
--> statement-breakpoint
-- Partial unique index: when variantId IS NULL, enforce uniqueness on user_id + product_id only
CREATE UNIQUE INDEX "waitlist_unique_without_variant" ON "waitlist_entries" ("user_id", "product_id") WHERE "variant_id" IS NULL;
--> statement-breakpoint
-- Rate limiter table for serverless-compatible rate limiting
CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"reset_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limits_identifier_idx" ON "rate_limits" ("identifier");
--> statement-breakpoint
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits" ("reset_at");
