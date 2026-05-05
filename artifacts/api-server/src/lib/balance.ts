/**
 * Central game balance constants.
 * All gameplay math lives here — never duplicate in other files.
 */

// ── Spiritual Root EXP multipliers ─────────────────────────────────────────
export const ROOT_EXP_MULTIPLIER: Record<string, number> = {
  common: 1.00,
  good:   1.08,
  rare:   1.16,
  epic:   1.25,
};

// ── Spiritual Root COMBAT multipliers (applied to ATK in dungeons & boss) ──
// Epic linh căn fighters hit noticeably harder than common root
export const ROOT_COMBAT_MULTIPLIER: Record<string, number> = {
  common: 1.00,
  good:   1.05,
  rare:   1.12,
  epic:   1.20,
};

export const ROOT_SKILL_AFFINITY: Record<string, number> = {
  common: 0.00,
  good:   0.03,
  rare:   0.06,
  epic:   0.10,
};

// ── Cultivation tick ────────────────────────────────────────────────────────
export const CULTIVATION_TICK_SECONDS = 5;  // seconds between EXP ticks

// ── Breakthrough costs (Linh Thạch) per realm ──────────────────────────────
// key matches realmKey prefix
export const BREAKTHROUGH_LINH_THACH: Record<string, number> = {
  phamnhan:   0,
  luyen_khi: 50,
  truc_co:   200,
  kim_dan:   800,
  nguyen_anh: 2000,
};

function breakthroughLSCost(realmKey: string): number {
  for (const prefix of Object.keys(BREAKTHROUGH_LINH_THACH)) {
    if (realmKey.startsWith(prefix)) return BREAKTHROUGH_LINH_THACH[prefix];
  }
  return 0;
}
export { breakthroughLSCost };

// ── Dungeon stamina cost ────────────────────────────────────────────────────
export const DUNGEON_STAMINA_COST: Record<string, number> = {
  easy:   6,
  medium: 10,
  hard:   16,
};
export const DEFAULT_DUNGEON_STAMINA_COST = 10;

// ── Rest (meditation recovery) ──────────────────────────────────────────────
export const REST_HP_PERCENT      = 0.40;  // restore 40% of max HP
export const REST_STAMINA_RESTORE = 30;    // flat stamina points
export const REST_COOLDOWN_SECONDS = 120;  // 2 min between rests

// ── Stamina passive regen ────────────────────────────────────────────────────
export const STAMINA_REGEN_AMOUNT        = 10;  // TL per tick
export const STAMINA_REGEN_INTERVAL_MIN  = 30;  // minutes per tick

// ── Element relations ───────────────────────────────────────────────────────
export const ELEMENT_RELATIONS: Record<string, { strong: string; weak: string }> = {
  kim:  { strong: "moc",  weak: "hoa"  },
  moc:  { strong: "tho",  weak: "kim"  },
  thuy: { strong: "hoa",  weak: "tho"  },
  hoa:  { strong: "kim",  weak: "thuy" },
  tho:  { strong: "thuy", weak: "moc"  },
};
export const ELEMENT_GENERATION: Record<string, string> = {
  kim: "thuy",
  thuy: "moc",
  moc: "hoa",
  hoa: "tho",
  tho: "kim",
};
export const ELEMENT_STRONG_MOD = 1.30;
export const ELEMENT_WEAK_MOD   = 0.75;
export const ELEMENT_GENERATION_MOD = 1.08;

// ── Economy guard rails ─────────────────────────────────────────────────────
export const MIN_LINH_THACH = 0;   // never go negative
export const MIN_HP         = 1;   // never die permanently

// ── Daily quest reset window ────────────────────────────────────────────────
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}
