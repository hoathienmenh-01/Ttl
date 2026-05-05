import { pgTable, text, integer, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { charactersTable } from "./characters";

export const economyLogsTable = pgTable("economy_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  charId: text("char_id").notNull().references(() => charactersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  source: text("source").notNull(),
  balanceAfter: integer("balance_after"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EconomyLog = typeof economyLogsTable.$inferSelect;
