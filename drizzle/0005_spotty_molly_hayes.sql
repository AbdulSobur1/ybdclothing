-- Migrate existing "hat" category products to "cap" (hats consolidated under caps)
UPDATE "products" SET "category" = 'cap' WHERE "category" = 'hat';
