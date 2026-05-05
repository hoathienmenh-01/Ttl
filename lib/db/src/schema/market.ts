import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingStatusEnum = pgEnum("listing_status", ["active", "sold", "cancelled"]);

export const marketListingsTable = pgTable("market_listings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull(),
  sellerName: text("seller_name").notNull(),
  inventoryItemId: text("inventory_item_id").notNull(),
  itemTemplateId: text("item_template_id").notNull(),
  itemName: text("item_name").notNull(),
  itemType: text("item_type").notNull(),
  quality: text("quality").notNull(),
  enhanceLv: integer("enhance_lv").notNull().default(0),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  qty: integer("qty").notNull().default(1),
  status: listingStatusEnum("status").notNull().default("active"),
  buyerId: text("buyer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  soldAt: timestamp("sold_at"),
});

export const insertMarketListingSchema = createInsertSchema(marketListingsTable).omit({ id: true, createdAt: true });
export type InsertMarketListing = z.infer<typeof insertMarketListingSchema>;
export type MarketListing = typeof marketListingsTable.$inferSelect;
