import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const charactersTable = pgTable("characters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => usersTable.id),
  name: text("name").notNull().unique(),
  realmKey: text("realm_key").notNull().default("phamnhan"),
  realmStage: integer("realm_stage").notNull().default(1),
  title: text("title"),
  exp: integer("exp").notNull().default(0),
  level: integer("level").notNull().default(1),

  hp: integer("hp").notNull().default(100),
  hpMax: integer("hp_max").notNull().default(100),
  mp: integer("mp").notNull().default(50),
  mpMax: integer("mp_max").notNull().default(50),
  stamina: integer("stamina").notNull().default(100),
  staminaMax: integer("stamina_max").notNull().default(100),

  power: integer("power").notNull().default(10),
  spirit: integer("spirit").notNull().default(10),
  speed: integer("speed").notNull().default(10),
  luck: integer("luck").notNull().default(5),
  daoVan: integer("dao_van").notNull().default(0),
  atk: integer("atk").notNull().default(15),
  def: integer("def").notNull().default(5),
  crit: real("crit").notNull().default(0.05),

  linhThach: integer("linh_thach").notNull().default(500),
  tienNgoc: integer("tien_ngoc").notNull().default(0),
  congHien: integer("cong_hien").notNull().default(0),

  primaryElement: text("primary_element"),
  spiritualRootGrade: text("spiritual_root_grade"),
  cultivating: boolean("cultivating").notNull().default(false),
  lastCultivationTick: timestamp("last_cultivation_tick"),

  sectId: text("sect_id"),
  pvpWins: integer("pvp_wins").notNull().default(0),
  pvpLosses: integer("pvp_losses").notNull().default(0),

  lastRestAt: timestamp("last_rest_at"),
  lastStaminaRegenAt: timestamp("last_stamina_regen_at"),
  lastDailyClaimAt: timestamp("last_daily_claim_at"),
  loginStreak: integer("login_streak").notNull().default(0),
  loginStreakUpdatedAt: timestamp("login_streak_updated_at"),
  dungeonClears: integer("dungeon_clears").notNull().default(0),
  bossKills: integer("boss_kills").notNull().default(0),
  alchemyCrafts: integer("alchemy_crafts").notNull().default(0),

  monthlyCardActive: boolean("monthly_card_active").notNull().default(false),
  monthlyCardExpiresAt: timestamp("monthly_card_expires_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCharacterSchema = createInsertSchema(charactersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
