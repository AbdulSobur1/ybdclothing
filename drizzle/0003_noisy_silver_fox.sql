CREATE TABLE "waitlist_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entries_user_id_product_id_variant_id_unique" UNIQUE("user_id","product_id","variant_id")
);
--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_auth.users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth.users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;