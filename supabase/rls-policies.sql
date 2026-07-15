-- ============================================
-- YBD Clothing — Row Level Security Policies
-- ============================================
-- Run this in your Supabase Dashboard → SQL Editor
-- AFTER running the Drizzle migrations.

-- 1. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. CART ITEMS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- 3. ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. ORDER ITEMS (inherits from orders via FK — users can see their own)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 5. Storage: Receipts bucket
-- Run these in Supabase Dashboard → SQL Editor to set up Storage policies.
-- (Storage buckets and their policies can also be managed via the Dashboard UI.)

-- Ensure the receipts bucket exists:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)
-- ON CONFLICT (id) DO NOTHING;

-- Ensure the product-images bucket exists (for admin product image uploads)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
-- CREATE POLICY "Anyone can read product images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'product-images');

-- Allow admin to upload product images
-- CREATE POLICY "Admin can upload product images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'service_role');

-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

-- Allow users to read their own receipts
CREATE POLICY "Users can read own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow the service role full access (for admin viewing)
CREATE POLICY "Service role can read all receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'service_role'
  );

-- 6. Waitlist Entries
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

-- 7. Wishlist Items
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

-- 8. Products (public read-only)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

-- 9. Product variants (public read-only)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product variants"
  ON product_variants FOR SELECT
  USING (true);

-- 10. Delivery zones (public read-only)
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read delivery zones"
  ON delivery_zones FOR SELECT
  USING (true);

-- 11. Order Notes (admin-only)
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can read order notes"
  ON order_notes FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Only admin can insert order notes"
  ON order_notes FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 12. Testimonials (public read-only, admin-only write)
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
