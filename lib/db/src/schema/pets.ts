import { pgTable, text, integer, real, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export type PetBonusStats = {
  atkPct?: number;
  defPct?: number;
  hpPct?: number;
};

export const petTemplatesTable = pgTable("pet_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  element: text("element"),
  rarity: text("rarity").notNull().default("pham"),
  bonusStats: jsonb("bonus_stats").$type<PetBonusStats>().default({}),
  procChance: real("proc_chance").notNull().default(0),
  procDamagePct: real("proc_damage_pct").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characterPetsTable = pgTable("character_pets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  charId: text("char_id").notNull(),
  petId: text("pet_id").notNull().references(() => petTemplatesTable.id),
  level: integer("level").notNull().default(1),
  active: boolean("active").notNull().default(false),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

export type PetTemplate = typeof petTemplatesTable.$inferSelect;
export type CharacterPet = typeof characterPetsTable.$inferSelect;
