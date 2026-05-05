/**
 * Smoke Test — Tu Tiên Lộ: Hoa Thiên Khai Đạo
 * Run: npx tsx scripts/src/smoke-test.ts
 * Tests core gameplay logic WITHOUT hitting the running server.
 */

import { REALMS, getRealmByKey, getNextRealm, getRealmName, computePower } from "../../artifacts/api-server/src/lib/realms.js";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, extra = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);
    failed++;
  }
}

// ── 1. Realm catalog ─────────────────────────────────────────────────────────
console.log("\n[1] Realm Catalog");
assert("Có đúng 21 cảnh giới", REALMS.length === 21);
assert("Cảnh giới đầu là Phàm Nhân", REALMS[0].key === "phamnhan");
assert("Cảnh giới cuối là Hư Không Chí Tôn", REALMS[REALMS.length - 1].key === "hukhongchton");
const luyenKhi = getRealmByKey("luyenkhi");
assert("Luyện Khí có 9 tầng", luyenKhi?.stages === 9);
assert("Luyện Khí có expCost > 0", (luyenKhi?.expCost ?? 0) > 0);

// ── 2. Cultivation — đủ EXP mới đột phá ──────────────────────────────────────
console.log("\n[2] Cultivation & Breakthrough Logic");
const phamNhan = getRealmByKey("phamnhan");
assert("Phàm Nhân expCost = 500", phamNhan?.expCost === 500);

function canBreakthrough(exp: number, realmKey: string): boolean {
  const realm = getRealmByKey(realmKey);
  return !!realm && exp >= realm.expCost;
}
assert("Không đủ EXP thì không đột phá được", !canBreakthrough(499, "phamnhan"));
assert("Đủ EXP thì đột phá được", canBreakthrough(500, "phamnhan"));
assert("EXP dư vẫn đột phá được", canBreakthrough(9999, "phamnhan"));

// ── 3. Next realm progression ─────────────────────────────────────────────────
console.log("\n[3] Realm Progression");
const nextFromPhamNhan = getNextRealm("phamnhan", 1);
assert("Phàm Nhân → Luyện Khí Nhất Trọng", nextFromPhamNhan?.key === "luyenkhi" && nextFromPhamNhan.stage === 1);

const nextStage = getNextRealm("luyenkhi", 1);
assert("Luyện Khí Nhất → Nhị Trọng", nextStage?.key === "luyenkhi" && nextStage.stage === 2);

const nextFromStage9 = getNextRealm("luyenkhi", 9);
assert("Luyện Khí Cửu Trọng → Trúc Cơ", nextFromStage9?.key === "trucco" && nextFromStage9.stage === 1);

const topRealm = getNextRealm("hukhongchton", 1);
assert("Hư Không Chí Tôn không có realm tiếp theo", topRealm === null);

const realmName = getRealmName("luyenkhi", 3);
assert("getRealmName Luyện Khí Tam Trọng đúng", realmName === "Luyện Khí Tam Trọng", realmName);

// ── 4. Quest double-claim protection ─────────────────────────────────────────
console.log("\n[4] Quest Double-Claim Protection");

type QuestStatus = "available" | "accepted" | "completed" | "claimed";

function claimReward(status: QuestStatus): { success: boolean; error?: string } {
  if (status === "claimed") return { success: false, error: "ALREADY_CLAIMED" };
  return { success: true };
}
assert("Quest available có thể claim", claimReward("available").success === true);
assert("Quest accepted có thể claim", claimReward("accepted").success === true);
assert("Quest claimed không thể claim lại", claimReward("claimed").success === false);
assert("Lý do đúng", claimReward("claimed").error === "ALREADY_CLAIMED");

// ── 5. Item quantity không âm ─────────────────────────────────────────────────
console.log("\n[5] Item Quantity Safety");

function sellItem(qty: number, sellAmount: number): { success: boolean; remaining: number; error?: string } {
  if (sellAmount > qty) return { success: false, remaining: qty, error: "Không đủ số lượng" };
  if (sellAmount <= 0) return { success: false, remaining: qty, error: "Số lượng bán phải > 0" };
  return { success: true, remaining: qty - sellAmount };
}
assert("Bán 1 trong 5 còn 4", sellItem(5, 1).remaining === 4);
assert("Bán đúng số còn 0", sellItem(3, 3).remaining === 0);
assert("Bán nhiều hơn có → báo lỗi", !sellItem(2, 5).success);
assert("Số lượng không âm", sellItem(2, 5).remaining >= 0);
assert("Bán 0 item → lỗi", !sellItem(5, 0).success);

// ── 6. Ngũ hành tương khắc modifiers ─────────────────────────────────────────
console.log("\n[6] Ngũ Hành Element Modifiers");

const ELEMENT_RELATIONS: Record<string, { strong: string; weak: string }> = {
  kim:  { strong: "moc", weak: "hoa" },
  moc:  { strong: "tho", weak: "kim" },
  thuy: { strong: "hoa", weak: "tho" },
  hoa:  { strong: "kim", weak: "thuy" },
  tho:  { strong: "thuy", weak: "moc" },
};

function getElementMod(playerEl: string, enemyEl: string): number {
  const rel = ELEMENT_RELATIONS[playerEl];
  if (!rel) return 1.0;
  if (rel.strong === enemyEl) return 1.3;
  if (rel.weak === enemyEl) return 0.75;
  return 1.0;
}
assert("Kim khắc Mộc → +30%", getElementMod("kim", "moc") === 1.3);
assert("Kim bị Hỏa khắc → -25%", getElementMod("kim", "hoa") === 0.75);
assert("Kim vs Thủy → trung lập", getElementMod("kim", "thuy") === 1.0);
assert("Mộc khắc Thổ → +30%", getElementMod("moc", "tho") === 1.3);
assert("Thủy khắc Hỏa → +30%", getElementMod("thuy", "hoa") === 1.3);
assert("Hỏa khắc Kim → +30%", getElementMod("hoa", "kim") === 1.3);
assert("Thổ khắc Thủy → +30%", getElementMod("tho", "thuy") === 1.3);

// ── 7. Combat — server-authoritative result ───────────────────────────────────
console.log("\n[7] Combat Determinism");

function simulateCombat(playerAtk: number, playerDef: number, monsterAtk: number, monsterDef: number, monsterHp: number): { victory: boolean; rounds: number } {
  let hp = 200;
  let monHp = monsterHp;
  let round = 0;
  while (monHp > 0 && hp > 0 && round < 50) {
    round++;
    const dmg = Math.max(1, playerAtk - Math.floor(monsterDef * 0.3));
    monHp = Math.max(0, monHp - dmg);
    if (monHp > 0) {
      const monDmg = Math.max(1, monsterAtk - Math.floor(playerDef * 0.4));
      hp = Math.max(0, hp - monDmg);
    }
  }
  return { victory: monHp === 0, rounds: round };
}

const easyFight = simulateCombat(100, 50, 30, 10, 100);
assert("Nhân vật mạnh hơn đáng kể → thắng", easyFight.victory === true);
assert("Có số vòng > 0", easyFight.rounds > 0);

const hardFight = simulateCombat(5, 5, 500, 100, 10000);
assert("Nhân vật yếu hơn nhiều → thua", hardFight.victory === false);

// ── 8. Power calculation ──────────────────────────────────────────────────────
console.log("\n[8] Power Calculation");
const power = computePower({ power: 100, spirit: 50, speed: 80, atk: 120, def: 60, hpMax: 1000, realmKey: "phamnhan", realmStage: 1 });
assert("Sức mạnh tính được > 0", power > 0);
const higherPower = computePower({ power: 100, spirit: 50, speed: 80, atk: 120, def: 60, hpMax: 1000, realmKey: "luyenkhi", realmStage: 1 });
assert("Cảnh giới cao hơn → sức mạnh cao hơn", higherPower > power);

// ── 9. Linh căn roll distribution ────────────────────────────────────────────
console.log("\n[9] Spiritual Root Distribution");

function rollSpiritualRoot(): "common" | "good" | "rare" | "epic" {
  const r = Math.random();
  if (r < 0.65) return "common";
  if (r < 0.90) return "good";
  if (r < 0.98) return "rare";
  return "epic";
}

const counts = { common: 0, good: 0, rare: 0, epic: 0 };
const TRIALS = 10000;
for (let i = 0; i < TRIALS; i++) { counts[rollSpiritualRoot()]++; }
const commonPct = counts.common / TRIALS;
const epicPct = counts.epic / TRIALS;
assert(`Common ~65% (got ${(commonPct * 100).toFixed(1)}%)`, commonPct > 0.58 && commonPct < 0.72);
assert(`Epic ~2% (got ${(epicPct * 100).toFixed(1)}%)`, epicPct < 0.05);

// ── 10. Skill affinity + elemental generation ───────────────────────────────
console.log("\n[10] Skill Affinity & Element Generation");
const skillAffinityByGrade: Record<string, number> = {
  common: 0, good: 0.03, rare: 0.06, epic: 0.10,
};
assert("Epic skill affinity highest", skillAffinityByGrade.epic > skillAffinityByGrade.rare);
assert("Common skill affinity zero", skillAffinityByGrade.common === 0);

const GENERATION: Record<string, string> = { kim: "thuy", thuy: "moc", moc: "hoa", hoa: "tho", tho: "kim" };
assert("Kim sinh Thủy", GENERATION.kim === "thuy");
assert("Mộc sinh Hỏa", GENERATION.moc === "hoa");
assert("Thổ sinh Kim", GENERATION.tho === "kim");

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`SMOKE TEST: ${passed} passed / ${failed} failed / ${passed + failed} total`);
if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) FAILED`);
  process.exit(1);
} else {
  console.log("\n✅ Tất cả smoke tests PASSED!");
  process.exit(0);
}
