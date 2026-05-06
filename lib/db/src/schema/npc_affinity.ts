import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { charactersTable } from "./characters";
import { npcsTable } from "./npcs";

export const characterNpcAffinityTable = pgTable("character_npc_affinity", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  charId: text("char_id").notNull().references(() => charactersTable.id),
  npcId: text("npc_id").notNull().references(() => npcsTable.id),
  affinity: integer("affinity").notNull().default(0),
  lastTalkedAt: timestamp("last_talked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("character_npc_affinity_char_npc_unique").on(table.charId, table.npcId),
]);

export type CharacterNpcAffinity = typeof characterNpcAffinityTable.$inferSelect;
