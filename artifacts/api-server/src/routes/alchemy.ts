import { Router } from "express";
import { db } from "@workspace/db";
import {
  alchemyRecipesTable, charactersTable, inventoryItemsTable, itemTemplatesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { checkAndAwardAchievements } from "../lib/achievements";
import { trackMissionProgress } from "../lib/missionProgress";
import { getRealmByKey } from "../lib/realms";
import { MIN_LINH_THACH } from "../lib/balance";

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

router.get("/alchemy/recipes", requireAuth, async (req, res) => {
  const recipes = await db.select().from(alchemyRecipesTable);
  const allItems = await db.select().from(itemTemplatesTable);
  const itemMap = new Map(allItems.map(i => [i.id, i]));

  res.json(recipes
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(r => ({
      id: r.id, name: r.name, description: r.description,
      inputItems: (r.inputItems as Array<{ itemId: string; qty: number }>).map(inp => ({
        itemId: inp.itemId,
        itemName: itemMap.get(inp.itemId)?.name ?? inp.itemId,
        qty: inp.qty,
      })),
      outputItem: {
        itemId: r.outputItemId,
        itemName: itemMap.get(r.outputItemId)?.name ?? r.outputItemId,
        qty: r.outputQty,
      },
      successRate: r.successRate,
      linhThachCost: r.linhThachCost,
      requiredRealm: r.requiredRealm ?? null,
    }))
  );
});

router.post("/alchemy/craft/:recipeId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const recipes = await db.select().from(alchemyRecipesTable)
    .where(eq(alchemyRecipesTable.id, String(req.params.recipeId))).limit(1);
  if (!recipes.length) { res.status(404).json({ error: "Công thức không tồn tại", code: "NOT_FOUND" }); return; }
  const recipe = recipes[0];

  // ── Realm check ──────────────────────────────────────────────────────────────
  if (recipe.requiredRealm) {
    const charRealm = getRealmByKey(char.realmKey);
    const reqRealm = getRealmByKey(recipe.requiredRealm);
    if (charRealm && reqRealm && charRealm.order < reqRealm.order) {
      res.status(400).json({ error: `Cần đạt ${reqRealm.name} để luyện công thức này`, code: "REALM_REQUIRED" });
      return;
    }
  }

  // ── Linh Thạch check ─────────────────────────────────────────────────────────
  if (char.linhThach < recipe.linhThachCost) {
    res.status(400).json({
      error: `Cần ${recipe.linhThachCost} Linh Thạch để luyện đan (hiện có ${char.linhThach}).`,
      code: "INSUFFICIENT_LINH_THACH",
    });
    return;
  }

  // ── Inventory check ───────────────────────────────────────────────────────────
  const inputItems = recipe.inputItems as Array<{ itemId: string; qty: number }>;
  const inventory = await db.select().from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.charId, char.id));

  const invMap = new Map<string, typeof inventory[0]>();
  for (const item of inventory) invMap.set(item.templateId, item);

  for (const inp of inputItems) {
    const held = invMap.get(inp.itemId);
    if (!held || held.qty < inp.qty) {
      const tmpl = await db.select().from(itemTemplatesTable)
        .where(eq(itemTemplatesTable.id, inp.itemId)).limit(1);
      const name = tmpl[0]?.name ?? inp.itemId;
      res.status(400).json({
        error: `Thiếu nguyên liệu: cần ${inp.qty}x ${name} (hiện có ${held?.qty ?? 0}).`,
        code: "INSUFFICIENT_ITEMS",
        itemId: inp.itemId,
        required: inp.qty,
        current: held?.qty ?? 0,
      });
      return;
    }
  }

  // ── Deduct items and LS ───────────────────────────────────────────────────────
  for (const inp of inputItems) {
    const held = invMap.get(inp.itemId)!;
    const newQty = held.qty - inp.qty;
    if (newQty <= 0) {
      await db.delete(inventoryItemsTable).where(eq(inventoryItemsTable.id, held.id));
    } else {
      await db.update(inventoryItemsTable).set({ qty: newQty })
        .where(eq(inventoryItemsTable.id, held.id));
    }
  }

  const newLinhThach = Math.max(MIN_LINH_THACH, char.linhThach - recipe.linhThachCost);

  // ── Roll success ──────────────────────────────────────────────────────────────
  const success = Math.random() < recipe.successRate;
  const now = new Date();

  if (success) {
    // Add output item to inventory
    const existing = await db.select().from(inventoryItemsTable)
      .where(and(
        eq(inventoryItemsTable.charId, char.id),
        eq(inventoryItemsTable.templateId, recipe.outputItemId),
      )).limit(1);

    if (existing.length) {
      await db.update(inventoryItemsTable).set({ qty: existing[0].qty + recipe.outputQty })
        .where(eq(inventoryItemsTable.id, existing[0].id));
    } else {
      await db.insert(inventoryItemsTable).values({
        charId: char.id, templateId: recipe.outputItemId, qty: recipe.outputQty,
      });
    }
  }

  await db.update(charactersTable).set({
    linhThach: newLinhThach,
    alchemyCrafts: char.alchemyCrafts + 1,
    updatedAt: now,
  }).where(eq(charactersTable.id, char.id));

  const [newlyEarned, completedMissions] = await Promise.all([
    checkAndAwardAchievements(char.id),
    trackMissionProgress(char.id, "alchemy_craft"),
  ]);

  const outputTmpl = await db.select().from(itemTemplatesTable)
    .where(eq(itemTemplatesTable.id, recipe.outputItemId)).limit(1);
  const outputName = outputTmpl[0]?.name ?? recipe.outputItemId;

  res.json({
    success,
    message: success
      ? `Luyện đan thành công! Nhận được ${recipe.outputQty}x ${outputName}.`
      : `Luyện đan thất bại. Tiêu hao ${recipe.linhThachCost} Linh Thạch và nguyên liệu.`,
    outputItem: success ? { name: outputName, qty: recipe.outputQty } : null,
    linhThachCost: recipe.linhThachCost,
    newlyEarned,
    completedMissions,
  });
});

export default router;
