export interface ProductVariant {
  id: number;
  productId: number;
  color: string | null;
  size: string | null;
  stockQuantity: number;
  sku: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  basePrice: number; // in kobo
  category: string;
  hasVariants: boolean;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface CartItemFull {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  product: Product;
  variant: ProductVariant | null;
}
