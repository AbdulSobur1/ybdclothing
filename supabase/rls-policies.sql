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

-- 6. Wishlist Items
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

-- 7. Products (public read-only)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

-- 8. Product variants (public read-only)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product variants"
  ON product_variants FOR SELECT
  USING (true);

-- 9. Delivery zones (public read-only)
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read delivery zones"
  ON delivery_zones FOR SELECT
  USING (true);
