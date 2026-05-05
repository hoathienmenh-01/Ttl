/**
 * Preflight for applying the mission_progress unique index.
 * Run before `pnpm --filter @workspace/db run push-force` on an existing DB.
 */
export {};

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to check mission_progress duplicates.");
  process.exit(2);
}

const [{ db, pool, missionProgressTable }, { sql }] = await Promise.all([
  import("../../lib/db/src/index.js"),
  import("drizzle-orm"),
]);

const duplicates = await db
  .select({
    charId: missionProgressTable.charId,
    templateId: missionProgressTable.templateId,
    count: sql<number>`count(*)::int`,
  })
  .from(missionProgressTable)
  .groupBy(missionProgressTable.charId, missionProgressTable.templateId)
  .having(sql`count(*) > 1`);

await pool.end();

if (duplicates.length > 0) {
  console.error("Duplicate mission_progress rows found. Clean these before applying the unique index:");
  for (const row of duplicates) {
    console.error(`- charId=${row.charId} templateId=${row.templateId} count=${row.count}`);
  }
  process.exit(1);
}

console.log("mission_progress duplicate check passed.");
