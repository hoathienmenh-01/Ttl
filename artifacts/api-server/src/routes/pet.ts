import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable, characterPetsTable, petTemplatesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

router.get("/pet/catalog", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  const pets = await db.select().from(petTemplatesTable);
  res.json(pets.sort((a, b) => a.sortOrder - b.sortOrder).map(pet => ({
    ...pet,
    canClaim: pet.unlockSource === "starter" || (pet.unlockSource === "event" && (pet.unlockRef !== "dungeon_clears_3" || char.dungeonClears >= 3)),
  })));
});

router.get("/pet/mine", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const rows = await db
    .select({ cp: characterPetsTable, pet: petTemplatesTable })
    .from(characterPetsTable)
    .innerJoin(petTemplatesTable, eq(characterPetsTable.petId, petTemplatesTable.id))
    .where(eq(characterPetsTable.charId, char.id));

  res.json(rows.map(({ cp, pet }) => ({
    id: cp.id,
    petId: pet.id,
    name: pet.name,
    description: pet.description,
    element: pet.element,
    rarity: pet.rarity,
    bonusStats: pet.bonusStats ?? {},
    procChance: pet.procChance,
    procDamagePct: pet.procDamagePct,
    unlockSource: pet.unlockSource,
    unlockRef: pet.unlockRef,
    level: cp.level,
    exp: cp.exp,
    expRequired: cp.level >= 5 ? 0 : 100,
    active: cp.active,
    acquiredAt: cp.acquiredAt,
  })));
});

router.post("/pet/:petId/claim", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const petId = String(req.params.petId);
  const pets = await db.select().from(petTemplatesTable).where(eq(petTemplatesTable.id, petId)).limit(1);
  if (!pets.length) { res.status(404).json({ error: "Linh thú không tồn tại", code: "PET_NOT_FOUND" }); return; }
  const pet = pets[0];

  const eventUnlocked = pet.unlockSource === "event"
    && (pet.unlockRef !== "dungeon_clears_3" || char.dungeonClears >= 3);
  if (pet.unlockSource !== "starter" && !eventUnlocked) {
    res.status(403).json({
      error: "Linh thú này cần mở khóa qua nhiệm vụ, boss hoặc sự kiện.",
      code: "PET_LOCKED",
      unlockSource: pet.unlockSource,
      unlockRef: pet.unlockRef,
    });
    return;
  }

  const existing = await db.select().from(characterPetsTable)
    .where(and(eq(characterPetsTable.charId, char.id), eq(characterPetsTable.petId, petId)))
    .limit(1);
  if (existing.length) { res.status(400).json({ error: "Đã sở hữu linh thú này", code: "PET_ALREADY_OWNED" }); return; }

  await db.insert(characterPetsTable).values({ charId: char.id, petId, level: 1, exp: 0, active: false });
  res.json({ message: `Đã kết duyên với ${pet.name}.`, petId });
});

router.post("/pet/:petId/equip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const petId = String(req.params.petId);
  const owned = await db.select().from(characterPetsTable)
    .where(and(eq(characterPetsTable.charId, char.id), eq(characterPetsTable.petId, petId)))
    .limit(1);
  if (!owned.length) {
    res.status(403).json({ error: "Chưa sở hữu linh thú này nên không thể đồng hành", code: "PET_NOT_OWNED" });
    return;
  }

  await db.update(characterPetsTable).set({ active: false }).where(eq(characterPetsTable.charId, char.id));
  await db.update(characterPetsTable).set({ active: true }).where(eq(characterPetsTable.id, owned[0].id));
  res.json({ message: "Đã chọn linh thú đồng hành.", petId, active: true });
});

router.post("/pet/:petId/unequip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const petId = String(req.params.petId);
  const owned = await db.select().from(characterPetsTable)
    .where(and(eq(characterPetsTable.charId, char.id), eq(characterPetsTable.petId, petId)))
    .limit(1);
  if (!owned.length) {
    res.status(403).json({ error: "Chưa sở hữu linh thú này nên không thể gỡ", code: "PET_NOT_OWNED" });
    return;
  }

  await db.update(characterPetsTable).set({ active: false }).where(eq(characterPetsTable.id, owned[0].id));
  res.json({ message: "Đã cho linh thú nghỉ.", petId, active: false });
});

export default router;
