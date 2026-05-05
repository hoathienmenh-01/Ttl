import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { charactersTable } from "./characters";

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  linhThach: number;
  itemId: string | null;
  title: string | null;
  isPremium: boolean;
}

export const battlePassSeasonsTable = pgTable("battle_pass_seasons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  tiers: jsonb("tiers").$type<BattlePassTier[]>().notNull().default([]),
});

export const battlePassProgressTable = pgTable("battle_pass_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  charId: text("char_id").notNull().references(() => charactersTable.id, { onDelete: "cascade" }),
  seasonId: text("season_id").notNull().references(() => battlePassSeasonsTable.id),
  passXp: integer("pass_xp").notNull().default(0),
  claimedTiers: jsonb("claimed_tiers").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type BattlePassSeason = typeof battlePassSeasonsTable.$inferSelect;
export type BattlePassProgress = typeof battlePassProgressTable.$inferSelect;
