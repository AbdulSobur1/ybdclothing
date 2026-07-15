/**
 * Seed script for YBD Clothing.
 *
 * Run with: `npx tsx src/lib/db/seed.ts`
 *
 * This seeds:
 * - Products with their variants
 * - Delivery zones (placeholder zones — owner will update)
 *
 * Prices are stored directly in Naira to avoid floating-point issues.
 * E.g. ₦18,000 → 18000
 */

import { db } from "./index";
import {
  products,
  productVariants,
  deliveryZones,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding YBD Clothing database...\n");

  // ── Clear existing data ──
  console.log("Clearing existing data...");
  await db.delete(productVariants);
  await db.delete(deliveryZones);
  await db.delete(products);

  // ── Products ──
  console.log("Seeding products...\n");

  // 1. YBD Baseball Cap
  const [baseballCap] = await db
    .insert(products)
    .values({
      name: "YBD Baseball Cap",
      description: "Classic baseball cap with embroidered YBD logo. Premium cotton construction with adjustable strap for the perfect fit.",
      basePrice: 18000, // ₦18,000
      category: "cap",
      hasVariants: true,
      imageUrl: null, // placeholder — owner will supply real photos
    })
    .returning();

  await db.insert(productVariants).values([
    { productId: baseballCap.id, color: "Black", size: null, stockQuantity: 20, sku: "YBD-BC-BLK" },
    { productId: baseballCap.id, color: "Blue", size: null, stockQuantity: 20, sku: "YBD-BC-BLU" },
    { productId: baseballCap.id, color: "Red", size: null, stockQuantity: 20, sku: "YBD-BC-RED" },
  ]);
  console.log(`  ✓ YBD Baseball Cap — ₦18,000 (Black, Blue, Red)`);

  // 2. YBD Cadet Cap 1
  const [cadetCap1] = await db
    .insert(products)
    .values({
      name: "YBD Cadet Cap 1",
      description: "Stylish cadet cap with a modern twist. Features the iconic YBD branding on the front panel.",
      basePrice: 19000, // ₦19,000
      category: "cap",
      hasVariants: false,
      imageUrl: null,
    })
    .returning();

  await db.insert(productVariants).values([
    { productId: cadetCap1.id, color: null, size: null, stockQuantity: 20, sku: "YBD-CC1" },
  ]);
  console.log(`  ✓ YBD Cadet Cap 1 — ₦19,000`);

  // 3. YBD Cadet Cap 2
  const [cadetCap2] = await db
    .insert(products)
    .values({
      name: "YBD Cadet Cap 2",
      description: "Alternative cadet cap design with a distinct color palette and detailing.",
      basePrice: 19000, // ₦19,000
      category: "cap",
      hasVariants: false,
      imageUrl: null,
    })
    .returning();

  await db.insert(productVariants).values([
    { productId: cadetCap2.id, color: null, size: null, stockQuantity: 20, sku: "YBD-CC2" },
  ]);
  console.log(`  ✓ YBD Cadet Cap 2 — ₦19,000`);

  // 4. YBD Trucker Cap (formerly Trucker Hat — hats now under Caps category)
  const [truckerCap] = await db
    .insert(products)
    .values({
      name: "YBD Trucker Cap",
      description: "Classic trucker cap with mesh back and foam front. Lightweight and breathable for everyday wear.",
      basePrice: 10000, // ₦10,000
      category: "cap",
      hasVariants: false,
      imageUrl: null,
    })
    .returning();

  await db.insert(productVariants).values([
    { productId: truckerCap.id, color: null, size: null, stockQuantity: 20, sku: "YBD-TH" },
  ]);
  console.log(`  ✓ YBD Trucker Cap — ₦10,000`);

  // 5. YBD Outta Space Tee
  const [outtaSpaceTee] = await db
    .insert(products)
    .values({
      name: "YBD Outta Space Tee",
      description: "Bold 'Outta Space' graphic tee. Premium 100% cotton with a relaxed fit. Available in multiple colors and sizes.",
      basePrice: 25000, // ₦25,000
      category: "tee",
      hasVariants: true,
      imageUrl: null,
    })
    .returning();

  const colors = ["White", "Black"];
  const sizes = ["S", "M", "L", "XL"];
  for (const color of colors) {
    for (const size of sizes) {
      await db.insert(productVariants).values({
        productId: outtaSpaceTee.id,
        color,
        size,
        stockQuantity: 20,
        sku: `YBD-OST-${color.slice(0, 4).toUpperCase()}-${size}`,
      });
    }
  }
  console.log(`  ✓ YBD Outta Space Tee — ₦25,000 (White/Black, S/M/L/XL)`);

  // 6. YBD Risk Takers Tee
  const [riskTakersTee] = await db
    .insert(products)
    .values({
      name: "YBD Risk Takers Tee",
      description: "'Risk Takers' graphic tee for those who dare. Premium cotton with a bold print that makes a statement.",
      basePrice: 25000, // ₦25,000
      category: "tee",
      hasVariants: true,
      imageUrl: null,
    })
    .returning();

  for (const color of colors) {
    for (const size of sizes) {
      await db.insert(productVariants).values({
        productId: riskTakersTee.id,
        color,
        size,
        stockQuantity: 20,
        sku: `YBD-RTT-${color.slice(0, 4).toUpperCase()}-${size}`,
      });
    }
  }
  console.log(`  ✓ YBD Risk Takers Tee — ₦25,000 (White/Black, S/M/L/XL)`);

  // ── Delivery Zones ──
  console.log("\nSeeding delivery zones...");

  await db.insert(deliveryZones).values([
    { zoneName: "Lagos Mainland", fee: 2000, active: true },     // ₦2,000
    { zoneName: "Lagos Island", fee: 3000, active: true },       // ₦3,000
    { zoneName: "Other States", fee: 5000, active: true },       // ₦5,000
  ]);
  console.log(`  ✓ Lagos Mainland — ₦2,000`);
  console.log(`  ✓ Lagos Island — ₦3,000`);
  console.log(`  ✓ Other States — ₦5,000`);

  console.log("\n✅ Seeding complete!");
  console.log("\n⚠️  IMPORTANT: The store owner should update delivery zone names, fees, and product stock numbers before going live.");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
