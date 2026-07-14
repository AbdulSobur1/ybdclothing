import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { wishlistItems, products, productVariants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { WishlistClient } from "./wishlist-client";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/wishlist");
  }

  const rawItems = await db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
      variantId: wishlistItems.variantId,
      createdAt: wishlistItems.createdAt,
      product: products,
      variant: productVariants,
    })
    .from(wishlistItems)
    .leftJoin(products, eq(wishlistItems.productId, products.id))
    .leftJoin(productVariants, eq(wishlistItems.variantId, productVariants.id))
    .where(eq(wishlistItems.userId, user.id))
    .orderBy(desc(wishlistItems.createdAt));

  // Serialize dates to strings for client component
  const items = rawItems.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        <h1
          className="text-3xl font-bold text-[#2C2C2C] mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          My Wishlist
        </h1>

        <WishlistClient items={items} />
      </div>
    </div>
  );
}
