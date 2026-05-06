import { Router } from "express";
import { db } from "@workspace/db";
import {
  skillTemplatesTable, characterSkillsTable, charactersTable, missionProgressTable
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();
const ACTIVE_SKILL_SLOTS = [1, 2, 3] as const;

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
    activeSlot: r.cs.activeSlot,
    level: r.cs.level, learnedAt: r.cs.learnedAt,
  })));
});

router.post("/skill/:skillId/equip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const skillId = String(req.params.skillId);
  const slot = Number((req.body as any)?.slot);
  if (!ACTIVE_SKILL_SLOTS.includes(slot as any)) {
    res.status(400).json({ error: "Slot kỹ năng không hợp lệ", code: "INVALID_SKILL_SLOT", slots: ACTIVE_SKILL_SLOTS });
    return;
  }

  const learned = await db.select().from(characterSkillsTable)
    .where(and(eq(characterSkillsTable.charId, char.id), eq(characterSkillsTable.skillId, skillId)))
    .limit(1);
  if (!learned.length) {
    res.status(403).json({ error: "Chưa học pháp thuật này nên không thể trang bị", code: "SKILL_NOT_LEARNED" });
    return;
  }

  await db.update(characterSkillsTable).set({ activeSlot: null })
    .where(and(eq(characterSkillsTable.charId, char.id), eq(characterSkillsTable.activeSlot, slot)));
  await db.update(characterSkillsTable).set({ activeSlot: slot })
    .where(eq(characterSkillsTable.id, learned[0].id));

  res.json({ message: `Đã đặt pháp thuật vào ô ${slot}.`, skillId, activeSlot: slot });
});

router.post("/skill/:skillId/unequip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const skillId = String(req.params.skillId);
  const learned = await db.select().from(characterSkillsTable)
    .where(and(eq(characterSkillsTable.charId, char.id), eq(characterSkillsTable.skillId, skillId)))
    .limit(1);
  if (!learned.length) {
    res.status(403).json({ error: "Chưa học pháp thuật này nên không thể gỡ", code: "SKILL_NOT_LEARNED" });
    return;
  }

  await db.update(characterSkillsTable).set({ activeSlot: null })
    .where(eq(characterSkillsTable.id, learned[0].id));

  res.json({ message: "Đã gỡ pháp thuật khỏi ô active.", skillId, activeSlot: null });
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
