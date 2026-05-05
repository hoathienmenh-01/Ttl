import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const achievementTemplatesTable = pgTable("achievement_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("misc"),
  conditionType: text("condition_type").notNull(),
  conditionValue: integer("condition_value").notNull().default(1),
  conditionData: jsonb("condition_data"),
  rewardLinhThach: integer("reward_linh_thach").notNull().default(0),
  rewardTitle: text("reward_title"),
  icon: text("icon").notNull().default("◆"),
  isHidden: boolean("is_hidden").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const characterAchievementsTable = pgTable("character_achievements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  charId: text("char_id").notNull(),
  achievementId: text("achievement_id").notNull().references(() => achievementTemplatesTable.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  claimedAt: timestamp("claimed_at"),
});

export type AchievementTemplate = typeof achievementTemplatesTable.$inferSelect;
export type CharacterAchievement = typeof characterAchievementsTable.$inferSelect;
