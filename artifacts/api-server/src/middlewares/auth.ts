import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function parseToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

// Simple token format: userId:timestamp:secret (base64 encoded)
const TOKEN_SECRET = process.env.SESSION_SECRET || "tu-tien-lo-secret-2026";

export function signToken(userId: string): string {
  const payload = `${userId}:${Date.now()}:${TOKEN_SECRET}`;
  return Buffer.from(payload).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 3) return null;
    const secret = parts.slice(2).join(":");
    if (secret !== TOKEN_SECRET) return null;
    return parts[0]; // userId
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = parseToken(req);
  if (!token) {
    res.status(401).json({ error: "Chưa đăng nhập", code: "UNAUTHORIZED" });
    return;
  }
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: "Token không hợp lệ", code: "INVALID_TOKEN" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users.length || users[0].banned) {
    res.status(401).json({ error: "Tài khoản không tồn tại hoặc bị khóa", code: "ACCOUNT_INVALID" });
    return;
  }
  (req as any).user = users[0];
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user.role !== "admin" && user.role !== "mod") {
      res.status(403).json({ error: "Không có quyền truy cập", code: "FORBIDDEN" });
      return;
    }
    next();
  });
}
