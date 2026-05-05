import { pgTable, text, integer, real, jsonb } from "drizzle-orm/pg-core";

export const alchemyRecipesTable = pgTable("alchemy_recipes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  inputItems: jsonb("input_items").notNull().$type<Array<{ itemId: string; qty: number }>>(),
  outputItemId: text("output_item_id").notNull(),
  outputQty: integer("output_qty").notNull().default(1),
  successRate: real("success_rate").notNull().default(1.0),
  linhThachCost: integer("linh_thach_cost").notNull().default(0),
  requiredRealm: text("required_realm"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type AlchemyRecipe = typeof alchemyRecipesTable.$inferSelect;
