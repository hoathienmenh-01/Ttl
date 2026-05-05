import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, charactersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.SESSION_SECRET ?? "salt"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dữ liệu không hợp lệ", code: "VALIDATION_ERROR" });
    return;
  }
  const { email, password, username } = parsed.data;

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email)).limit(1);
  if (existing.length) {
    res.status(400).json({ error: "Danh hiệu đạo đồ đã được khai lập hoặc dữ liệu không hợp lệ", code: "EMAIL_TAKEN" });
    return;
  }

  const existingUsername = await db.select().from(usersTable)
    .where(eq(usersTable.username, username)).limit(1);
  if (existingUsername.length) {
    res.status(400).json({ error: "Tên đạo hiệu đã có người sử dụng", code: "USERNAME_TAKEN" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, username, role: "player",
  }).returning();

  const token = signToken(user.id);
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  res.status(201).json({
    token,
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, hasCharacter: chars.length > 0,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dữ liệu không hợp lệ", code: "VALIDATION_ERROR" });
    return;
  }
  const { email, password } = parsed.data;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!users.length) {
    res.status(401).json({ error: "Danh hiệu hoặc huyền pháp không chính xác", code: "INVALID_CREDENTIALS" });
    return;
  }
  const user = users[0];
  if (user.banned) {
    res.status(401).json({ error: "Tài khoản bị phong ấn", code: "ACCOUNT_BANNED" });
    return;
  }
  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Danh hiệu hoặc huyền pháp không chính xác", code: "INVALID_CREDENTIALS" });
    return;
  }
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
  const token = signToken(user.id);
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  res.json({
    token,
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, hasCharacter: chars.length > 0,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/logout", (req, res) => {
  res.json({ message: "Đã xuất định, hẹn gặp lại đạo hữu." });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  res.json({
    id: user.id, email: user.email, username: user.username,
    role: user.role, hasCharacter: chars.length > 0,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
