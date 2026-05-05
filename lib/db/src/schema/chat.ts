import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatChannelEnum = pgEnum("chat_channel", ["world", "sect", "private"]);

export const chatMessagesTable = pgTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channel: chatChannelEnum("channel").notNull().default("world"),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRealm: text("sender_realm").notNull().default("Phàm Nhân"),
  targetId: text("target_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
