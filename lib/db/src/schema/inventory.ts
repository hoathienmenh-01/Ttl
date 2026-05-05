import { pgTable, text, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const qualityEnum = pgEnum("item_quality", ["pham", "linh", "huyen", "tien", "than"]);
export const itemTypeEnum = pgEnum("item_type", ["weapon", "armor", "belt", "boots", "hat", "accessory", "pill", "herb", "ore", "key", "artifact", "misc"]);
export const equipSlotEnum = pgEnum("equip_slot", ["weapon", "armor", "belt", "boots", "hat", "accessory"]);

export const itemTemplatesTable = pgTable("item_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quality: qualityEnum("quality").notNull(),
  type: itemTypeEnum("type").notNull(),
  baseStats: json("base_stats").notNull().default({}),
  iconUrl: text("icon_url"),
  description: text("description").notNull().default(""),
  sellPrice: integer("sell_price").notNull().default(10),
  stackable: boolean("stackable").notNull().default(false),
});

export const inventoryItemsTable = pgTable("inventory_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  charId: text("char_id").notNull(),
  templateId: text("template_id").notNull().references(() => itemTemplatesTable.id),
  qty: integer("qty").notNull().default(1),
  enhanceLv: integer("enhance_lv").notNull().default(0),
  equipped: boolean("equipped").notNull().default(false),
  slot: equipSlotEnum("slot"),
  affixes: json("affixes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
export type ItemTemplate = typeof itemTemplatesTable.$inferSelect;
