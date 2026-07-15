-- ============================================
-- YBD Clothing — Run ALL pending migrations
-- ============================================
-- Paste this entire script into Supabase Dashboard → SQL Editor
-- and run it once. It creates all missing tables, sets up
-- foreign keys, and enables Row Level Security.

-- ========== TABLES ==========

-- 0002: wishlist_items
CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "product_id" integer NOT NULL,
  "variant_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_auth_users_fk"
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;

ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade;

ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_variant_id_product_variants_fk"
  FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null;

-- 0003: waitlist_entries
CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "product_id" integer NOT NULL,
  "variant_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "waitlist_entries_user_product_variant_unique"
    UNIQUE("user_id","product_id","variant_id")
);

ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_auth_users_fk"
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;

ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_product_id_products_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade;

ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_variant_id_product_variants_fk"
  FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null;

-- 0004: order_notes + testimonials
CREATE TABLE IF NOT EXISTS "order_notes" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "note" text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" serial PRIMARY KEY NOT NULL,
  "quote" text NOT NULL,
  "author" varchar(255) NOT NULL,
  "role" varchar(255),
  "rating" integer DEFAULT 5 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_orders_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade;

ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_created_by_auth_users_fk"
  FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null;

-- 0005: migrate hat products to cap
UPDATE "products" SET "category" = 'cap' WHERE "category" = 'hat';

-- ========== ROW LEVEL SECURITY ==========

-- Wishlist Items
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wishlist"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- Waitlist Entries
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own waitlist"
  ON waitlist_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own waitlist"
  ON waitlist_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own waitlist"
  ON waitlist_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Order Notes (admin-only via service role)
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can read order notes"
  ON order_notes FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Only admin can insert order notes"
  ON order_notes FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Testimonials (public read, admin write)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read testimonials"
  ON testimonials FOR SELECT
  USING (true);

CREATE POLICY "Only admin can manage testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only admin can update testimonials"
  ON testimonials FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Only admin can delete testimonials"
  ON testimonials FOR DELETE
  USING (auth.role() = 'service_role');
