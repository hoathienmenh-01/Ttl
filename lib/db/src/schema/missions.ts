import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missionTypeEnum = pgEnum("mission_type", ["main", "realm", "sect", "npc", "grind", "event"]);
export const missionStatusEnum = pgEnum("mission_status", ["available", "accepted", "completed", "claimed", "locked"]);

export const npcQuestStageEnum = pgEnum("npc_quest_stage", ["all", "early", "mid", "late"]);

export const missionTemplatesTable = pgTable("mission_templates", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: missionTypeEnum("type").notNull(),
  npcName: text("npc_name"),
  realmRequired: text("realm_required"),
  progressMax: integer("progress_max").notNull().default(1),
  objectiveType: text("objective_type"),
  availableStage: npcQuestStageEnum("available_stage").notNull().default("all"),
  rewardExp: integer("reward_exp").notNull().default(0),
  rewardLinhThach: integer("reward_linh_thach").notNull().default(0),
  rewardItems: text("reward_items").array().notNull().default([]),
  order: integer("order").notNull().default(0),
});

export const missionProgressTable = pgTable("mission_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  charId: text("char_id").notNull(),
  templateId: text("template_id").notNull().references(() => missionTemplatesTable.id),
  status: missionStatusEnum("status").notNull().default("available"),
  progress: integer("progress").notNull().default(0),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
});

export const insertMissionProgressSchema = createInsertSchema(missionProgressTable).omit({ id: true });
export type InsertMissionProgress = z.infer<typeof insertMissionProgressSchema>;
export type MissionTemplate = typeof missionTemplatesTable.$inferSelect;
export type MissionProgress = typeof missionProgressTable.$inferSelect;
