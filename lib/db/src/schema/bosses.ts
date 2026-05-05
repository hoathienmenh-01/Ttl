import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bossTemplatesTable = pgTable("boss_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  element: text("element"),
  hpMax: integer("hp_max").notNull().default(10000),
  power: integer("power").notNull().default(100),
  atk: integer("atk").notNull().default(50),
  def: integer("def").notNull().default(20),
  minRealm: text("min_realm").notNull().default("phamnhan"),
  zone: text("zone").notNull().default("thanh_khe"),
  isWorldBoss: boolean("is_world_boss").notNull().default(false),
  expDrop: integer("exp_drop").notNull().default(100),
  linhThachDrop: integer("linh_thach_drop").notNull().default(50),
  dropItems: text("drop_items").array().notNull().default([]),
  spawnIntervalMinutes: integer("spawn_interval_minutes").notNull().default(30),
});

export const bossSpawnsTable = pgTable("boss_spawns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id").notNull().references(() => bossTemplatesTable.id),
  hpCurrent: integer("hp_current").notNull(),
  spawnedAt: timestamp("spawned_at").notNull().defaultNow(),
  deadAt: timestamp("dead_at"),
  killedBy: text("killed_by"),
});

export const bossAttackLogsTable = pgTable("boss_attack_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  spawnId: text("spawn_id").notNull(),
  charId: text("char_id").notNull(),
  dmgDealt: integer("dmg_dealt").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBossSpawnSchema = createInsertSchema(bossSpawnsTable).omit({ id: true });
export type InsertBossSpawn = z.infer<typeof insertBossSpawnSchema>;
export type BossTemplate = typeof bossTemplatesTable.$inferSelect;
export type BossSpawn = typeof bossSpawnsTable.$inferSelect;
