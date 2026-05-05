import { pgTable, text, integer, real, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const skillTemplatesTable = pgTable("skill_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  element: text("element").notNull(),
  type: text("type").notNull().default("attack"),
  description: text("description"),
  mpCost: integer("mp_cost").default(0),
  cooldownSeconds: integer("cooldown_seconds").default(0),
  damageMultiplier: real("damage_multiplier").default(1.0),
  healMultiplier: real("heal_multiplier").default(0),
  realmRequired: text("realm_required"),
  effects: jsonb("effects").$type<Record<string, number>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characterSkillsTable = pgTable("character_skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  charId: text("char_id").notNull(),
  skillId: text("skill_id").notNull(),
  level: integer("level").default(1),
  learnedAt: timestamp("learned_at").defaultNow().notNull(),
});

export const dungeonTemplatesTable = pgTable("dungeon_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  element: text("element"),
  minRealm: text("min_realm").default("phamnhan"),
  difficulty: text("difficulty").default("easy"),
  stages: integer("stages").default(3),
  monsterName: text("monster_name").notNull(),
  monsterHp: integer("monster_hp").default(500),
  monsterAtk: integer("monster_atk").default(50),
  monsterDef: integer("monster_def").default(10),
  expReward: integer("exp_reward").default(200),
  linhThachReward: integer("linh_thach_reward").default(100),
  dropItems: jsonb("drop_items").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
