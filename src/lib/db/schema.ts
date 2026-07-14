import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "rejected",
  "shipped",
  "completed",
]);

export const deliveryMethodEnum = pgEnum("delivery_method", ["pickup", "delivery"]);

// ──────────────────────────────────────────────
// Profiles (extends Supabase Auth users)
// ──────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  defaultAddress: text("default_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: integer("base_price").notNull(), // stored in Naira (integer to avoid float issues)
  category: varchar("category", { length: 50 }).notNull(), // "cap", "tee", "hat"
  hasVariants: boolean("has_variants").default(false).notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ──────────────────────────────────────────────
// Product Variants (for tees with color/size)
// ──────────────────────────────────────────────

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 100 }),
  size: varchar("size", { length: 50 }),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  sku: varchar("sku", { length: 100 }),
});

// ──────────────────────────────────────────────
// Cart Items (server-side cart per user)
// ──────────────────────────────────────────────

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ──────────────────────────────────────────────
// Store Settings (persisted admin configuration)
// ──────────────────────────────────────────────

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ──────────────────────────────────────────────
// Delivery Zones
// ──────────────────────────────────────────────

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  zoneName: varchar("zone_name", { length: 255 }).notNull(),
  fee: integer("fee").notNull(), // in Naira
  active: boolean("active").default(true).notNull(),
});

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  deliveryMethod: deliveryMethodEnum("delivery_method"),
  deliveryZoneId: integer("delivery_zone_id").references(() => deliveryZones.id, {
    onDelete: "set null",
  }),
  deliveryFee: integer("delivery_fee"), // snapshot at order time (Naira)
  deliveryAddress: text("delivery_address"), // snapshot at order time
  subtotal: integer("subtotal").notNull(), // in Naira
  total: integer("total").notNull(), // in Naira
  receiptUrl: text("receipt_url"), // Supabase Storage path
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ──────────────────────────────────────────────
// Order Items
// ──────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  nameSnapshot: varchar("name_snapshot", { length: 255 }).notNull(),
  priceSnapshot: integer("price_snapshot").notNull(), // in Naira
  quantity: integer("quantity").notNull().default(1),
});

// ──────────────────────────────────────────────
// Reference to Supabase auth.users (for FK)
// Drizzle doesn't manage auth.users — this is just
// so we can reference it in FK constraints.
// ──────────────────────────────────────────────

export const authUsers = pgTable("auth.users", { id: uuid("id").primaryKey() }, (table) => ({
  id: table.id,
}));
