-- Add snapshot columns to order_items for variant/product details captured at order time
ALTER TABLE "order_items" 
ADD COLUMN "color_snapshot" varchar(100),
ADD COLUMN "size_snapshot" varchar(50),
ADD COLUMN "image_snapshot" text;
