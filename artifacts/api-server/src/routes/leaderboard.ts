import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable, sectsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getRealmName, computePower } from "../lib/realms";

const router = Router();

router.get("/leaderboard", requireAuth, async (req, res) => {
  const type = (req.query.type as string) || "power";
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const chars = await db.select().from(charactersTable);

  let sorted = chars.map(c => ({
    characterId: c.id, name: c.name,
    realmName: getRealmName(c.realmKey, c.realmStage),
    realmStage: c.realmStage,
    power: computePower(c),
    realmOrder: 0,
    primaryElement: c.primaryElement ?? null,
    sectName: null as string | null,
    pvpWins: c.pvpWins,
    _realmKey: c.realmKey,
  }));

  if (type === "power") {
    sorted.sort((a, b) => b.power - a.power);
  } else if (type === "realm") {
    sorted.sort((a, b) => b.power - a.power);
  } else if (type === "pvp") {
    sorted.sort((a, b) => b.pvpWins - a.pvpWins);
  }

  const topN = sorted.slice(0, limit);
  res.json(topN.map((c, i) => ({ rank: i + 1, ...c })));
});

export default router;
