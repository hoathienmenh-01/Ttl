import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const topupStatusEnum = pgEnum("topup_status", ["pending", "approved", "rejected"]);

export const topupRequestsTable = pgTable("topup_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  charId: text("char_id"),
  amount: integer("amount").notNull(),
  tienNgocGranted: integer("tien_ngoc_granted").notNull().default(0),
  status: topupStatusEnum("status").notNull().default("pending"),
  transferCode: text("transfer_code").notNull(),
  processedBy: text("processed_by"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTopupRequestSchema = createInsertSchema(topupRequestsTable).omit({ id: true, createdAt: true });
export type InsertTopupRequest = z.infer<typeof insertTopupRequestSchema>;
export type TopupRequest = typeof topupRequestsTable.$inferSelect;
