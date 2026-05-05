import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const npcsTable = pgTable("npcs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title"),
  faction: text("faction").default("hoa_thien_mon"),
  role: text("role").notNull(),
  element: text("element"),
  description: text("description"),
  dialogue: jsonb("dialogue").$type<Record<string, string>>().default({}),
  questIds: jsonb("quest_ids").$type<string[]>().default([]),
  avatarCode: text("avatar_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
