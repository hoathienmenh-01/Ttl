import { Router } from "express";
import { db } from "@workspace/db";
import {
  skillTemplatesTable, characterSkillsTable, charactersTable, missionProgressTable
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

router.get("/skill/catalog", async (req, res) => {
  const skills = await db.select().from(skillTemplatesTable);
  res.json(skills);
});

router.get("/skill/mine", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật" }); return; }

  const learned = await db
    .select({ cs: characterSkillsTable, st: skillTemplatesTable })
    .from(characterSkillsTable)
    .innerJoin(skillTemplatesTable, eq(characterSkillsTable.skillId, skillTemplatesTable.id))
    .where(eq(characterSkillsTable.charId, char.id));

  res.json(learned.map(r => ({
    id: r.cs.id, skillId: r.st.id, name: r.st.name, element: r.st.element,
    type: r.st.type, description: r.st.description, mpCost: r.st.mpCost,
    damageMultiplier: r.st.damageMultiplier, healMultiplier: r.st.healMultiplier,
    level: r.cs.level, learnedAt: r.cs.learnedAt,
  })));
});

router.post("/skill/:skillId/learn", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật" }); return; }

  const skills = await db.select().from(skillTemplatesTable).where(eq(skillTemplatesTable.id, String(req.params.skillId))).limit(1);
  if (!skills.length) { res.status(404).json({ error: "Pháp thuật không tồn tại" }); return; }
  const skill = skills[0];

  const existing = await db.select().from(characterSkillsTable)
    .where(and(eq(characterSkillsTable.charId, char.id), eq(characterSkillsTable.skillId, skill.id)))
    .limit(1);
  if (existing.length) { res.status(400).json({ error: "Đã học pháp thuật này rồi" }); return; }

  const LEARN_COST = 500;
  if (char.linhThach < LEARN_COST) {
    res.status(400).json({ error: `Cần ${LEARN_COST} Linh Thạch để học pháp thuật này` });
    return;
  }

  await db.update(charactersTable).set({
    linhThach: char.linhThach - LEARN_COST, updatedAt: new Date(),
  }).where(eq(charactersTable.id, char.id));

  await db.insert(characterSkillsTable).values({
    charId: char.id, skillId: skill.id, level: 1,
  });

  res.json({ message: `Đã học được pháp thuật: ${skill.name}. Tốn ${LEARN_COST} Linh Thạch.`, skillName: skill.name });
});

export default router;
