import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sectsTable = pgTable("sects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  level: integer("level").notNull().default(1),
  maxMembers: integer("max_members").notNull().default(50),
  treasuryLinhThach: integer("treasury_linh_thach").notNull().default(0),
  description: text("description").notNull().default(""),
  leaderId: text("leader_id"),
  leaderName: text("leader_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSectSchema = createInsertSchema(sectsTable).omit({ id: true, createdAt: true });
export type InsertSect = z.infer<typeof insertSectSchema>;
export type Sect = typeof sectsTable.$inferSelect;
