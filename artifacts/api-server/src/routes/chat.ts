import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, charactersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";
import { getRealmName } from "../lib/realms";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

router.get("/chat/messages", requireAuth, async (req, res) => {
  const channel = (req.query.channel as string) || "world";
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.channel, channel as any))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json(messages.reverse().map(m => ({
    id: m.id, channel: m.channel, senderName: m.senderName,
    senderRealm: m.senderRealm, content: m.content,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/chat/send", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const schema = z.object({
    channel: z.enum(["world", "sect", "private"]).default("world"),
    content: z.string().min(1).max(300),
    targetId: z.string().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Nội dung không hợp lệ", code: "INVALID_CONTENT" }); return; }

  const realmName = getRealmName(char.realmKey, char.realmStage);
  const [msg] = await db.insert(chatMessagesTable).values({
    channel: parsed.data.channel,
    senderId: char.id, senderName: char.name, senderRealm: realmName,
    targetId: parsed.data.targetId ?? null,
    content: parsed.data.content,
  }).returning();

  res.json({
    id: msg.id, channel: msg.channel, senderName: msg.senderName,
    senderRealm: msg.senderRealm, content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
