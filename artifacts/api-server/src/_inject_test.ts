import { db } from "@workspace/db";
import { inventoryItemsTable } from "@workspace/db";
import { readFileSync, writeFileSync } from "fs";

const data = JSON.parse(readFileSync("/tmp/wtest.json", "utf8"));
const charId = data.charId as string;

const inserted = await db
  .insert(inventoryItemsTable)
  .values({ charId, templateId: "pham_kiem", qty: 1, equipped: false })
  .returning({ id: inventoryItemsTable.id });

console.log("Inserted weapon itemId:", inserted[0]?.id);
writeFileSync("/tmp/wtest.json", JSON.stringify({ ...data, weaponItemId: inserted[0]?.id }));
process.exit(0);
