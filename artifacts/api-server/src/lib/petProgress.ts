import { db } from "@workspace/db";
import { characterPetsTable, petTemplatesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { applyPetExp, normalizePetXpGrant } from "./petCombat";

export const PET_UNLOCKS = {
  starter: "starter",
  mission: "mission",
  boss: "boss",
  event: "event",
} as const;

export async function grantActivePetExp(charId: string, rawGain: number) {
  const gained = normalizePetXpGrant(rawGain);
  if (gained <= 0) return null;
  const rows = await db
    .select({ cp: characterPetsTable, pet: petTemplatesTable })
    .from(characterPetsTable)
    .innerJoin(petTemplatesTable, eq(characterPetsTable.petId, petTemplatesTable.id))
    .where(and(eq(characterPetsTable.charId, charId), eq(characterPetsTable.active, true)))
    .limit(1);
  if (!rows.length) return null;

  const current = rows[0].cp;
  const next = applyPetExp(current.level, current.exp, gained);
  await db.update(characterPetsTable)
    .set({ level: next.level, exp: next.exp })
    .where(eq(characterPetsTable.id, current.id));

  return {
    petId: rows[0].pet.id,
    name: rows[0].pet.name,
    expGained: next.gained,
    level: next.level,
    exp: next.exp,
    leveledUp: next.level > current.level,
  };
}

export async function unlockPetForCharacter(charId: string, petId: string, source: string) {
  const pets = await db.select().from(petTemplatesTable).where(eq(petTemplatesTable.id, petId)).limit(1);
  if (!pets.length) return null;

  const existing = await db.select().from(characterPetsTable)
    .where(and(eq(characterPetsTable.charId, charId), eq(characterPetsTable.petId, petId)))
    .limit(1);
  if (existing.length) return null;

  await db.insert(characterPetsTable).values({ charId, petId, level: 1, exp: 0, active: false });
  return { petId, name: pets[0].name, source };
}
