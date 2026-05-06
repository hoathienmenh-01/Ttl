# HANDOFF — Tu Tiên Lộ: Hoa Thiên Khai Đạo

## Current Status: CORE GAMEPLAY + QUEST/NPC/ACHIEVEMENT MVP POLISH ✅

Ngày cập nhật: 2026-05-06
Phiên AI: Docs audit — skill combat, daily reset 04:00, achievement UI/toast, NPC affinity MVP đã hoàn thiện

---

## Session 2026-05-06 — Skill Combat MVP + Build Baseline

### Files Read / Audited
- Root/config: `README.md`, `HANDOFF.md`, `replit.md`, `AGENTS.md`, `.replit`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.base.json`
- Docs/markdown: `docs/AI_CONTEXT_MIN.md`, `docs/TECH_STACK_VA_DATA_MODEL.md`, `docs/KICH_BAN_BUILD_VA_PROMPT_AI.md`, attached markdown copies in `attached_assets/`
- Workspace/package configs: `artifacts/api-server/package.json`, `artifacts/tu-tien-lo/package.json`, `lib/db/package.json`, `scripts/package.json`
- Gameplay code: `artifacts/api-server/src/routes/dungeon.ts`, `boss.ts`, `skill.ts`, `cultivation.ts`, `artifacts/api-server/src/lib/balance.ts`, `missionProgress.ts`, `realms.ts`, `scripts/src/smoke-test.ts`
- DB schema: `lib/db/src/schema/characters.ts`, `skills.ts`, `bosses.ts`, `missions.ts`, `npcs.ts`

### Changes Made
- Added `artifacts/api-server/src/lib/skillCombat.ts`
  - Central server-side helper for learned skill combat use.
  - Chooses learned attack skills only when enough MP and cooldown is ready.
  - Applies elemental/root affinity, caps skill damage multiplier at `1.65`, returns MP cost/cooldown/log text.
- Updated `artifacts/api-server/src/lib/balance.ts`
  - Added `SKILL_DAMAGE_MULTIPLIER_CAP` and `SKILL_COOLDOWN_ROUND_SECONDS`.
- Updated `artifacts/api-server/src/routes/dungeon.ts`
  - Replaced old flat skill ATK bonus with real skill casts during combat rounds.
  - Dungeon combat now consumes MP, respects cooldown rounds, logs skill casts, and persists remaining MP server-side.
- Updated `artifacts/api-server/src/routes/boss.ts`
  - Boss attack now loads learned skills server-side, applies one eligible skill cast, consumes MP, returns `skillUsed` and `mpRemaining`, and includes skill cast in combat logs.
- Updated `scripts/src/smoke-test.ts`
  - Added learned-skill combat checks: enough MP casts, MP cost, damage cap, no-cast on low MP, no-cast on cooldown.
- Updated `scripts/tsconfig.json`
  - Set `rootDir` to repo root so the existing smoke test import from `artifacts/api-server` typechecks.
- Updated Vite configs in `artifacts/tu-tien-lo/vite.config.ts` and `artifacts/mockup-sandbox/vite.config.ts`
  - `PORT` and `BASE_PATH` now default locally for production build, while still accepting Replit env values.

### Commands Run
- `git fetch origin main` — pass, `FETCH_HEAD` matched local `HEAD`.
- `git switch -c feature/skill-combat-mvp` — branch created.
- `pnpm install` — initially failed on Windows because root `preinstall` uses `sh`.
- `pnpm install --ignore-scripts` — pass, dependencies available.
- `pnpm typecheck` — pass.
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts` — pass, 47/47.
- `pnpm build` — pass after Vite config baseline fix. Remaining warning: frontend chunk `529.01 kB` exceeds Vite warning threshold.

### Risks / Notes
- Skill cooldown is MVP round-based inside one combat request; no persistent per-skill cooldown table yet.
- Boss attack is one combat action, so only one skill can fire per request.
- Skill selection is automatic server-side; no frontend-selected active skill/equip slot yet.
- `pnpm install` without `--ignore-scripts` still fails on Windows unless `sh` is available; Replit/Linux should be fine.

### Next Recommended Task
- Add active/equipped skill slots and expose current skill usage summary in Dungeon/Boss UI panels, still keeping all damage/MP/cooldown resolution server-side.

---

## Completed Features

### Infrastructure
- [x] pnpm monorepo: `artifacts/api-server` + `artifacts/tu-tien-lo` + `lib/db`
- [x] PostgreSQL + Drizzle ORM (schema modules đã gồm achievements, economy, battle_pass, npc_affinity)
- [x] Express 5 API server, server-authoritative
- [x] React + Vite + TypeScript frontend
- [x] Tailwind CSS dark cultivation theme
- [x] Token auth (base64url, localStorage `tienlo_token`)
- [x] Workflows cấu hình sẵn trên Replit
- [x] **Auto GitHub sync** — `GitHub Sync` workflow pushes to `hoathienmenh-01/Ttl` mỗi 60 giây, chỉ khi có commit mới (so sánh HEAD sha). Requires `GITHUB_TOKEN` env var (đã có sẵn trong Replit env).

### Commercial Systems (Session 7) — KHÔNG PAY-TO-WIN
- [x] **Hành Đạo Lệnh (Battle Pass)** — 10 tầng miễn phí. Kiếm Hành Đạo Điểm (HĐĐ) từ: bí cảnh (+50), nhiệm vụ (+30), boss (+20). Phần thưởng: LS + vật phẩm + danh hiệu. Không premium, không bán cảnh giới/ATK.
  - Schema: `battle_pass_seasons`, `battle_pass_progress` (đã có từ trước)
  - Route: `GET /battle-pass`, `POST /battle-pass/claim/:tier`
  - Seed: Season 1 "Khai Thiên Lập Địa" 3 tháng, 10 tầng
  - Frontend: `/battle-pass` page
- [x] **Nguyệt Đạo Thẻ (Monthly Card)** — Kích hoạt = 30 Tiên Ngọc / 30 ngày. Chỉ trao tiện lợi:
  - Điểm danh nhận 200 LS/ngày (thay 100 LS thông thường)
  - Admin cấp thẻ qua panel (không cần thanh toán thật)
  - Schema: thêm `monthlyCardActive` + `monthlyCardExpiresAt` vào characters, DB migrated
  - Route: `POST /monthly-card/activate` (tốn 30 TN), `POST /admin/monthly-card/grant`
  - Frontend: `/monthly-card` page với bảng đặc quyền
- [x] **Economy Log Coverage** — `logEconomy()` được gọi ở dungeon và mission khi nhận thưởng
  - `dungeon.ts`: log exp_gain + linh_thach_gain khi chiến thắng
  - `mission.ts`: log exp_gain + linh_thach_gain khi nhận thưởng
- [x] **Admin Economy Dashboard** — Tab mới trong admin panel:
  - Tab "Kinh Tế": xem nhật ký giao dịch toàn server hoặc lọc theo CharID
  - Tab "Người Dùng": hiển thị thêm LS, TN, trạng thái Nguyệt Đạo Thẻ, CharID (click-to-copy)
  - Tổng quan thêm stat `activeMonthlyCards`
  - Route: `GET /admin/economy-logs?charId=&limit=`
- [x] **Kiểm soát anti-double-claim, anti-negative** — Giữ nguyên từ session trước

### Gameplay Core
- [x] Đăng ký / đăng nhập
- [x] Tạo nhân vật + linh căn roll server-side (common 65% / good 25% / rare 8% / epic 2%)
- [x] 5 ngũ hành chính: Kim, Mộc, Thủy, Hỏa, Thổ
- [x] Roll không có legendary — giữ đúng 65/25/8/2
- [x] Linh căn grade ảnh hưởng nhẹ EXP, combat, và skill affinity
- [x] Primary element + quan hệ ngũ hành ảnh hưởng combat (tương khắc / tương sinh / trung lập)
- [x] Combat deterministic, server-authoritative
- [x] Skill combat MVP: learned skills được dùng server-side trong dungeon/boss combat, có MP cost, cooldown vòng combat, cap sát thương
- [x] Tu luyện nhập định (EXP tích lũy theo thời gian thực, server-authoritative)
- [x] Đột phá cảnh giới (21 cảnh giới, server-authoritative)
- [x] Boss thế giới với shared HP pool
- [x] Bí cảnh 6 loại — server tính toàn bộ combat, ngũ hành modifier + final boss floor
- [x] Pháp thuật 7 loại theo ngũ hành — học tốn Linh Thạch
- [x] Quest: 17 nhiệm vụ (main/realm/sect/npc/grind), double-claim protected bằng server state/transaction guard
- [x] Daily grind quest reset theo mốc 04:00 server local time
- [x] NPC: 6 NPC với dialogue và quest riêng
- [x] NPC affinity MVP: bảng `character_npc_affinity`, API get/talk, rank thresholds, UI affinity + nút trò chuyện
- [x] Achievement MVP: catalog/check, claim reward server-side, page UI, sidebar claim badge, toast thành tựu mới
- [x] **Inventory / Equipment MVP hoàn chỉnh** (Session 9):
  - 6 slot trang bị: weapon, armor, hat, belt, boots, accessory — tất cả có item trong catalog
  - Catalog mở rộng: 35 items (vũ khí, giáp, mũ, đai, giày, phụ kiện, đan, thảo dược, quặng)
  - Equip/unequip → stat tự động thay đổi trên character + power recompute ngay lập tức
  - Consumable use → HP/MP/EXP effect trả về effectsSummary rõ ràng
  - Anti-negative: qty không thể âm, sell clamped đến qty thực tế
  - Equip wrong slot blocked (type check server-side)
  - Dùng item không tồn tại / không phải của nhân vật → 404
  - Sell equipped item → 400 ITEM_EQUIPPED
  - Frontend: CharStatsBar hiển thị chỉ số hiện tại (thấy ngay sau equip/unequip)
  - Frontend: EquipmentPanel hiển thị 6 slot, slot trống hiện "Trống"
  - Frontend: filter tab đầy đủ (all/weapon/armor/hat/belt/boots/accessory/pill/herb/ore/misc)
  - Frontend: disabled state cho nút equip/unequip/use khi đang pending
  - Frontend: toast hiển thị newPower sau khi equip/unequip
  - Admin: POST /admin/item/give — cấp item bất kỳ cho nhân vật (test/smoke)
  - Admin: GET /admin/item/templates — list template cho dropdown
  - Admin UI: tab "Cấp Vật Phẩm" với dropdown chọn item và số lượng
- [x] Tông môn: 5 sect (Hoa Thiên Môn là chính)
- [x] Chat: world/sect/private
- [x] Phiên chợ
- [x] Bảng xếp hạng
- [x] Nạp tiền (manual review)
- [x] Admin panel
- [x] Luyện đan system hoàn chỉnh (Alchemy — kết hợp herb → pill, success rate, realm gating)

### Session 7 — Commercial Systems (No Pay-to-Win) ✅

#### Battle Pass (Free Tier)
- [x] **Schema**: `battle_pass_seasons` + `battle_pass_progress` tables
- [x] **API**: `GET /battle-pass` + `POST /battle-pass/claim/:tier`
- [x] **10 tầng thưởng** — XP thresholds: 100/250/450/700/1000/1350/1750/2200/2700/3200
- [x] **Pass XP sources**: daily_login=+10, mission=+25, dungeon=+15, boss=+20
- [x] **Cosmetic titles** (không bán sức mạnh): Tier 4 "Tu Sĩ Nhập Môn", Tier 8 "Hoa Thiên Đệ Tử", Tier 10 "Thiên Tông Tinh Anh"
- [x] **Item rewards**: Hồi Khí Đan (T2), Khai Tâm Đan (T4+T8), Trúc Cơ Đan (T6)
- [x] **Linh Thạch rewards**: T1=200, T3=500, T5=800, T7=1000, T9=1500, T10=2000
- [x] **Anti-double-claim**: server checks `claimedTiers[]` before granting
- [x] **Season seeded**: "Mùa 1 — Khai Thiên" (1 tháng)
- [x] **Frontend page**: `/battle-pass` với XP bar, tier cards, claim buttons
- [x] **Premium placeholder**: design-only block, "Sắp ra mắt" — không bán sức mạnh

#### Economy Logs / Reward History
- [x] **Schema**: `economy_logs` table (type, amount, source, balanceAfter, meta, createdAt)
- [x] **API**: `GET /economy-log` (player, 50 entries) + `GET /economy-log/admin` (admin/mod, 200 entries)
- [x] **Logged events**: linh_thach_gain, linh_thach_spend, exp_gain, item_grant
- [x] **Sources tracked**: dungeon, mission, daily_login, boss, battle_pass, sell_item, market_buy
- [x] **Frontend page**: `/economy-log` với timeline, source badge, balance-after display

#### 7-Day Login Streak
- [x] **Schema**: `login_streak` + `login_streak_updated_at` columns on characters
- [x] **Anti-double-claim**: kiểm tra `lastDailyClaimAt >= todayStart`, trả lỗi với `nextClaimAt`
- [x] **Streak logic**: ngày kế tiếp → tăng streak; miss 1 ngày → reset về 1; sau day 7 → về 1
- [x] **Day rewards**:
  - Day 1: +50 LS
  - Day 2: +100 LS + 1x Hồi Khí Đan
  - Day 3: +150 LS
  - Day 4: +200 LS
  - Day 5: +300 LS + 1x Khai Tâm Đan
  - Day 6: +400 LS
  - Day 7: +800 LS + 1x Trúc Cơ Đan
- [x] **Economy log**: mỗi claim ghi log đầy đủ
- [x] `GET /character/streak-rewards` — expose reward table to frontend
- [x] Response trả `loginStreak`, `streakDay`, `nextStreakDay`, `allRewards`

#### Pass XP Integration (All Sources)
- [x] `dungeon.ts` — grantBattlePassXp(char.id, 15) + logEconomy on victory
- [x] `mission.ts` — grantBattlePassXp(char.id, 25) + logEconomy on claim
- [x] `character.ts` daily-reward — grantBattlePassXp(char.id, 10) + logEconomy
- [x] `boss.ts` — grantBattlePassXp(char.id, 20) + logEconomy on kill

#### Anti-Abuse Protections
- [x] Anti-double-claim daily reward (server checks timestamp, not just flag)
- [x] Anti-double-claim battle pass tier (server checks claimedTiers[])
- [x] Pass XP gated behind real activity (không phải mua)
- [x] Tất cả rewards không bán sức mạnh tuyệt đối (chỉ Linh Thạch + cosmetic)

---

### Session 6 Bug Fixes — Core Loop Audit (5 bugs fixed)
- [x] **Mission item rewards inserted into inventory**
- [x] **Sell equipped item blocked** — 400 ITEM_EQUIPPED
- [x] **`useCompleteMission` invalidates `["inventory"]`**
- [x] **Mission "Nhận Thưởng" button smart-disabled**
- [x] **Mission page error state**
- [x] **Dungeon page empty state**

### Session 5 Fixes
- [x] **Equipment stat sync (P5)** — `buildStatUpdates()` helper
- [x] **Express 5 `req.params` cast fixes**
- [x] **Frontend equip/unequip hooks**
- [x] **Mission progress bar**
- [x] **Linh căn combat multiplier (P6)**
- [x] **Skill affinity surfaced on character UI**
- [x] **Ngũ hành bonus/counter surfaced on home + create-character UI**

### Stamina & Rest Polish (Session 4)
- [x] **Stamina passive regen** — +10 TL mỗi 30 phút
- [x] **Rest cooldown 2 phút**
- [x] **Cooldown timer UI**
- [x] **DB migration** — `last_rest_at`, `last_stamina_regen_at`

### Commercial Systems (Session 3)
- [x] Balance constants tập trung — `balance.ts`
- [x] Linh căn EXP multiplier (common 1.0x → epic 1.25x)
- [x] Root skill affinity balance constants
- [x] Element generation relation balance constants
- [x] Linh Thạch cost khi đột phá
- [x] Stamina system cho dungeon (6/10/16 TL)
- [x] Skills dùng trong combat
- [x] Daily quest reset
- [x] REST endpoint `POST /character/rest`
- [x] Guide/Tutorial page `/guide`

---

## Key Files

| File | Purpose |
|------|---------|
| `artifacts/api-server/src/lib/balance.ts` | ALL game constants |
| `artifacts/api-server/src/lib/skillCombat.ts` | Learned skill combat resolver: MP cost, cooldown, affinity, damage cap |
| `artifacts/api-server/src/lib/dailyReset.ts` | Shared 04:00 reset window helper for daily systems |
| `artifacts/api-server/src/lib/dailyMission.ts` | Daily grind reset helpers used by mission/NPC quest APIs |
| `artifacts/api-server/src/lib/npcAffinity.ts` | NPC affinity gain/cap/rank helper |
| `artifacts/api-server/src/lib/achievements.ts` | Achievement catalog/check/grant helper |
| `artifacts/api-server/src/lib/economyLog.ts` | logEconomy() helper — ghi economy_logs |
| `artifacts/api-server/src/lib/battlePassXp.ts` | grantBattlePassXp() — upsert battle_pass_progress |
| `artifacts/api-server/src/routes/battle-pass.ts` | GET /battle-pass + POST /battle-pass/claim/:tier |
| `artifacts/api-server/src/routes/economy-log.ts` | GET /economy-log + GET /economy-log/admin |
| `artifacts/api-server/src/routes/character.ts` | daily-reward với 7-day streak + economy log |
| `artifacts/api-server/src/routes/dungeon.ts` | Dungeon combat + final boss + economy log |
| `artifacts/api-server/src/routes/boss.ts` | Boss combat + economy log + pass XP |
| `artifacts/api-server/src/routes/mission.ts` | Mission complete + economy log + pass XP |
| `artifacts/api-server/src/routes/npc.ts` | NPC dialogue/quest APIs + affinity get/talk APIs |
| `artifacts/api-server/src/routes/achievement.ts` | Achievement list + server-side reward claim |
| `artifacts/api-server/src/seed.ts` | Battle pass season "Mùa 1 — Khai Thiên" seeded |
| `lib/db/src/schema/battle_pass.ts` | battlePassSeasonsTable + battlePassProgressTable + BattlePassTier |
| `lib/db/src/schema/economy_logs.ts` | economyLogsTable |
| `lib/db/src/schema/npc_affinity.ts` | `character_npc_affinity` unique `(char_id, npc_id)` table |
| `lib/db/src/schema/characters.ts` | loginStreak + loginStreakUpdatedAt columns |
| `artifacts/tu-tien-lo/src/pages/battle-pass.tsx` | Battle Pass UI — tiers, XP bar, claim |
| `artifacts/tu-tien-lo/src/pages/economy-log.tsx` | Lịch Sử Kinh Tế UI — transaction log |
| `artifacts/tu-tien-lo/src/pages/achievement.tsx` | Achievement UI + claim states |
| `artifacts/tu-tien-lo/src/pages/npc.tsx` | NPC quest/dialogue UI + affinity panel |
| `artifacts/tu-tien-lo/src/lib/hooks.ts` | useBattlePass, useClaimBattlePassTier, useEconomyLog |
| `artifacts/tu-tien-lo/src/components/GameShell.tsx` | Nav: Battle Pass/Lịch Sử/Achievement + claim badge/toast shell behavior |
| `scripts/src/check-mission-progress-duplicates.ts` | Preflight duplicate mission progress checker before schema push |

---

## Battle Pass Design

### Tier Structure (Free Pass, 10 Tiers)
| Tier | XP Required | LS Reward | Item | Title |
|------|------------|-----------|------|-------|
| 1 | 100 | 200 | — | — |
| 2 | 250 | — | Hồi Khí Đan | — |
| 3 | 450 | 500 | — | — |
| 4 | 700 | — | Khai Tâm Đan | Tu Sĩ Nhập Môn |
| 5 | 1000 | 800 | — | — |
| 6 | 1350 | — | Trúc Cơ Đan | — |
| 7 | 1750 | 1000 | — | — |
| 8 | 2200 | — | Khai Tâm Đan | Hoa Thiên Đệ Tử |
| 9 | 2700 | 1500 | — | — |
| 10 | 3200 | 2000 | — | Thiên Tông Tinh Anh |

### Pass XP Sources
| Activity | XP |
|----------|-----|
| Điểm danh hàng ngày | +10 |
| Hoàn thành nhiệm vụ | +25 |
| Chinh phục bí cảnh | +15 |
| Tiêu diệt Boss | +20 |

---

## Architecture Decisions Made

| Quyết định | Lý do |
|-----------|-------|
| Giữ PostgreSQL | Đã có sẵn, ổn định |
| Server combat | Frontend chỉ gửi POST /dungeon/:id/enter, server tính hết |
| Delta stat approach | `buildStatUpdates()` tracks sign ± so equip/unequip is idempotent |
| ROOT_COMBAT_MULTIPLIER separate from ROOT_EXP_MULTIPLIER | Combat và EXP có design curves khác nhau |
| Element modifier: +30% / -25% | Cân bằng: không quá mạnh |
| 65/25/8/2% linh căn | Theo spec, không có legendary |
| Battle Pass chỉ cosmetic title | Không bán cảnh giới, không bán ATK/DEF |
| Economy log ghi server-side | Frontend không thể giả mạo transactions |
| Streak reset after day 7 → day 1 | Motivate daily login mà không exponential reward |

---

## Rules (KHÔNG VI PHẠM)

- ❌ Không tích hợp payment thật
- ❌ Không bán cảnh giới
- ❌ Không bán đồ top
- ❌ Không bán EXP khổng lồ
- ❌ Không tạo gacha thật
- ✅ Battle Pass chỉ có Linh Thạch (farmable) + cosmetic titles + convenience items
- ✅ Tất cả rewards đều kiếm được qua gameplay

---

## Known Issues

1. **Market listing** — cần có item trong inventory mới list được.
2. **Chat** — refetch mỗi 5s, không phải WebSocket thật.
3. **New player dungeon difficulty** — ATK=15 starter char struggles vs monHP=300. By design: equip items + skills first.
4. **DB schema rollout** — DB thật cần chạy Drizzle schema push/preflight để có unique mission progress và `character_npc_affinity`.
5. **Achievement GET side effect** — `GET /achievement` hiện có thể auto-award newly met achievements; nên tách explicit check/event flow sau.
6. **Vite build warning** — frontend production build còn chunk size warning, chưa phải lỗi build.

---

## Next Recommended Tasks (Ưu tiên cao → thấp)

### P8 — NPC affinity next steps
- [x] NPC affinity tracking — `character_npc_affinity` table, `GET /npc/:id/affinity`, `POST /npc/:id/talk`
- [x] Affinity bar/action trong NPC page
- [ ] Talk cooldown hoặc daily talk limit
- [ ] Unlock new dialogue at affinity thresholds 20/50/80
- [ ] Quest gating/flavor text dựa trên affinity rank
- [ ] Apply Drizzle schema push cho `character_npc_affinity` trên DB thật

### P9 — Content expansion
- [ ] Thêm quest cho Kim Đan và Nguyên Anh tier (chỉ sửa seed.ts + re-seed)
- [ ] More alchemy recipes (cao cấp hơn)
- [ ] Thêm item drops từ boss

### P10 — Social & Economy
- [x] Achievement notification badge/toast
- [ ] Make achievement checking explicit hoặc move `newlyEarned` vào action responses để tránh side effect trên GET
- [ ] Auction marketplace (bid thay vì mua ngay)
- [ ] PvP arena (challenge/duel, betting)

### P11 — Next Systems
- [ ] Pet / Companion MVP
- [ ] Dungeon boss nhiều tầng hơn
- [ ] Guild war / sect war foundation

---

## Do NOT Repeat

- Đừng rebuild DB từ đầu — schema đã stable
- Đừng đổi auth system — token đang hoạt động
- Đừng thêm Redux/Zustand — TanStack Query đã đủ
- Đừng đổi sang SQLite — PostgreSQL đang ổn
- API server KHÔNG hot-reload — phải restart_workflow sau mỗi thay đổi backend

---

## Seed Data Quick Reference

| Data | Số lượng | Cách reset |
|------|----------|------------|
| Item templates | 19 | `cd artifacts/api-server && npx tsx src/seed.ts` |
| Skill templates | 7 | (cùng seed) |
| Dungeon templates | 6 | (cùng seed) |
| Boss templates | 5 | (cùng seed) |
| Mission templates | 17 | (cùng seed) |
| NPCs | 6 | (cùng seed) |
| Sects | 5 | (cùng seed) |
| Battle Pass Season | 1 | "Mùa 1 — Khai Thiên" (onConflictDoNothing) |
| Admin | 1 | email: admin@tutienlo.vn / pass: admin123456 |

---

## Environment Variables Required

```
DATABASE_URL=<PostgreSQL connection string>
SESSION_SECRET=<random secret for token signing>
PORT=<set by Replit workflow>
```

---

## Build Commands

```bash
# Typecheck (must exit 0)
pnpm --filter @workspace/api-server exec tsc --noEmit

# Rebuild lib/db after schema changes (required before typecheck)
pnpm run typecheck:libs

# DB schema push (after lib/db/src/schema changes)
cd lib/db && pnpm run push-force

# Re-seed (onConflictDoNothing — safe to re-run)
cd artifacts/api-server && npx tsx src/seed.ts

# Restart API server (required after any backend change)
# → Use restart_workflow "artifacts/api-server: API Server"
```

---

## Session Update - 2026-05-06 03:41:48 +07:00

### Task Done
- Fixed daily grind mission reset consistency for mission and NPC quest APIs.
- Added pure smoke coverage for daily grind reset behavior.

### Files Read
- `README.md`
- `HANDOFF.md`
- `replit.md`
- `AGENTS.md`
- `docs/AI_CONTEXT_MIN.md`
- `docs/TECH_STACK_VA_DATA_MODEL.md`
- `docs/KICH_BAN_BUILD_VA_PROMPT_AI.md`
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.base.json`, `.replit`
- `artifacts/api-server/src/routes/mission.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/api-server/src/lib/missionProgress.ts`
- `lib/db/src/schema/missions.ts`
- `scripts/src/smoke-test.ts`

### Files Changed
- `artifacts/api-server/src/lib/dailyMission.ts`
- `artifacts/api-server/src/lib/missionProgress.ts`
- `artifacts/api-server/src/routes/mission.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `scripts/src/smoke-test.ts`
- `HANDOFF.md`

### Logic New / Fixed
- Stale daily grind claim now means `type=grind`, `status=claimed`, and `claimedAt` is not today.
- Stale grind quests now display as `available` with progress `0` and no visible `claimedAt`.
- `POST /mission/:missionId/accept` reopens yesterday's claimed grind row instead of returning "already accepted".
- NPC quest list now uses the same daily reset helper as `/mission`.
- `trackMissionProgress()` clears stale `claimedAt`/`completedAt` when today's objective progress reactivates a claimed grind quest.

### Commands Run
- `git pull origin main`
- `pnpm install`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`
- `pnpm build`

### Test / Build Result
- PASS: `pnpm install`
- PASS: `pnpm typecheck`
- PASS: smoke test, `52 passed / 0 failed / 52 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Daily reset still uses local calendar day via existing `isSameDay()`, not a configured 04:00 reset window.
- Mission completion reward grant is still not wrapped in a DB transaction; high-concurrency double-submit hardening remains a later task.
- Vite build has an existing frontend chunk-size warning over 500 kB.

### Next Recommended Tasks
- Implement explicit 04:00 daily reset boundary.
- Add DB transaction/idempotency hardening around mission completion reward grant.
- Continue with achievement notification popup or NPC affinity after daily reset hardening.

---

## Session Update - 2026-05-06 03:49:33 +07:00

### Task Done
- Hardened mission completion reward claim against concurrent double-submit.

### Files Read
- `README.md`
- `HANDOFF.md`
- `replit.md`
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.base.json`
- `artifacts/api-server/src/routes/mission.ts`
- `artifacts/api-server/src/lib/economyLog.ts`
- `artifacts/api-server/src/lib/grantPassXp.ts`
- `lib/db/src/schema/missions.ts`
- `lib/db/src/schema/characters.ts`
- `lib/db/src/schema/inventory.ts`

### Files Changed
- `artifacts/api-server/src/routes/mission.ts`
- `HANDOFF.md`

### Logic New / Fixed
- `POST /mission/:missionId/complete` now wraps mission progress update, character EXP/Linh Thach update, and reward item grant in a Drizzle transaction.
- Added PostgreSQL `pg_advisory_xact_lock(hashtext(charId), hashtext(missionId))` so concurrent requests for the same character and mission serialize before reward state is re-read.
- Mission progress and character balances are refetched inside the lock before reward grant.
- Duplicate same-day claim still returns `ALREADY_CLAIMED`; stale daily grind claim still follows the daily reset rules.
- Economy log and battle pass XP remain post-transaction best-effort side effects and use the committed balances returned by the transaction.

### Commands Run
- `git status --short --branch`
- `git checkout main`
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`
- `pnpm build`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `52 passed / 0 failed / 52 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Advisory lock is PostgreSQL-specific, which matches the repo stack but is not portable to SQLite.
- There is still no DB unique constraint on `(char_id, template_id)` in the Drizzle schema; the advisory lock covers route concurrency but a future migration should enforce this at the DB layer.
- Battle pass XP grant is outside the transaction and best effort, matching prior behavior.

### Next Recommended Tasks
- Add DB unique index/constraint for mission progress `(char_id, template_id)` with a migration.
- Implement explicit 04:00 daily reset boundary.
- Continue with achievement notification popup or NPC affinity.

---

## Session Update - 2026-05-06 03:52:18 +07:00

### Task Done
- Implemented explicit 04:00 daily reset boundary for daily grind missions and daily login reward.

### Files Read
- `README.md`
- `HANDOFF.md`
- `replit.md`
- `artifacts/api-server/src/lib/dailyMission.ts`
- `artifacts/api-server/src/routes/character.ts`
- `scripts/src/smoke-test.ts`

### Files Changed
- `artifacts/api-server/src/lib/dailyReset.ts`
- `artifacts/api-server/src/lib/dailyMission.ts`
- `artifacts/api-server/src/routes/character.ts`
- `scripts/src/smoke-test.ts`
- `replit.md`
- `HANDOFF.md`

### Logic New / Fixed
- Added shared reset helpers with `DAILY_RESET_HOUR = 4`.
- Daily grind stale-claim checks now use reset windows instead of calendar midnight.
- Daily login reward anti-double-claim, next claim time, and streak continuation now use the 04:00 reset window.
- Smoke tests cover 03:59 still belonging to the previous reset window and 04:01 starting the new window.

### Commands Run
- `git status --short --branch`
- `git checkout main`
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `58 passed / 0 failed / 58 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Reset window uses server local time; deployments should keep timezone explicit and stable.
- Existing users who claimed between 00:00 and 03:59 may see behavior change to the intended 04:00 window.

### Next Recommended Tasks
- Add DB unique index/constraint for mission progress `(char_id, template_id)` with a migration.
- Continue with achievement notification popup or NPC affinity.

---

## Session Update - 2026-05-06 03:54:04 +07:00

### Task Done
- Added schema-level unique index for mission progress per character and mission template.

### Files Read
- `README.md`
- `HANDOFF.md`
- `replit.md`
- `lib/db/drizzle.config.ts`
- `lib/db/package.json`
- `lib/db/src/schema/missions.ts`

### Files Changed
- `lib/db/src/schema/missions.ts`
- `HANDOFF.md`

### Logic New / Fixed
- `mission_progress` now declares `mission_progress_char_template_unique` on `(char_id, template_id)` in Drizzle schema.
- This aligns the database schema source-of-truth with route-level idempotency and prevents duplicate progress rows after the next Drizzle schema push.

### Commands Run
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `58 passed / 0 failed / 58 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Existing databases with duplicate `(char_id, template_id)` mission progress rows must be cleaned before applying the unique index.
- Repo uses `drizzle-kit push`, not checked-in migration files, so deployment must run the schema push step explicitly.

### Next Recommended Tasks
- Add a preflight cleanup/check script for duplicate `mission_progress` rows before DB push.
- Continue with achievement notification popup or NPC affinity.

---

## Session Update - 2026-05-06 03:57:54 +07:00

### Task Done
- Added DB preflight script for duplicate mission progress rows before applying the unique index.
- Fixed root `preinstall` to be cross-platform on Windows by replacing `sh` with a Node command.

### Files Read
- `HANDOFF.md`
- `scripts/package.json`
- `scripts/tsconfig.json`
- `lib/db/src/index.ts`
- `lib/db/src/schema/index.ts`

### Files Changed
- `package.json`
- `scripts/package.json`
- `scripts/src/check-mission-progress-duplicates.ts`
- `HANDOFF.md`

### Logic New / Fixed
- New script: `pnpm --filter @workspace/scripts run check:mission-progress`.
- The script requires `DATABASE_URL`, queries `mission_progress`, and exits non-zero if duplicate `(char_id, template_id)` rows exist.
- Root `preinstall` now removes unwanted lockfiles and enforces pnpm using Node, avoiding the previous Windows `sh` failure.

### Commands Run
- `git pull origin main`
- `pnpm install`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`
- `pnpm --filter @workspace/scripts run check:mission-progress`
- `pnpm build`

### Test / Build Result
- PASS: `pnpm install`
- PASS: `pnpm typecheck`
- PASS: smoke test, `58 passed / 0 failed / 58 total`
- PASS: `pnpm build`
- EXPECTED FAIL/BLOCKED: `check:mission-progress` exits 2 because this local shell has no `DATABASE_URL`.

### Known Risks
- The preflight script must be run in an environment with `DATABASE_URL` before applying the unique index to an existing DB.
- The script reports duplicates but does not delete or merge rows automatically.

### Next Recommended Tasks
- Add an explicit duplicate cleanup/admin runbook if production data contains duplicates.
- Continue with achievement notification popup or NPC affinity.

---

## Session Update - 2026-05-06 03:59:16 +07:00

### Task Done
- Added frontend achievement claim notification badge in the sidebar.
- Fixed frontend daily check-in indicator to use the same 04:00 reset window as the server.

### Files Read
- `HANDOFF.md`
- `artifacts/api-server/src/routes/achievement.ts`
- `artifacts/api-server/src/lib/achievements.ts`
- `artifacts/tu-tien-lo/src/pages/achievement.tsx`
- `artifacts/tu-tien-lo/src/components/GameShell.tsx`
- `artifacts/tu-tien-lo/src/lib/hooks.ts`

### Files Changed
- `artifacts/tu-tien-lo/src/components/GameShell.tsx`
- `HANDOFF.md`

### Logic New / Fixed
- Game shell now queries achievements and shows a small count badge on the `Thành Tựu` sidebar item when rewards are claimable.
- Client daily check-in indicator now uses a 04:00 reset window instead of midnight, matching backend daily reward behavior.
- No reward or achievement claim logic moved to the client; frontend only displays server data and navigates/calls existing APIs.

### Commands Run
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `58 passed / 0 failed / 58 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Game shell now calls `/achievement`, whose backend currently auto-checks and may create newly earned achievements as part of the GET.
- Daily reset helper is duplicated client-side; if the server reset hour changes later, expose it via API or shared package.

### Next Recommended Tasks
- Move daily reset constants into a shared package if more frontend surfaces need them.
- Done after this session: NPC affinity MVP and achievement toast are both implemented; continue with cooldown/dialogue unlocks.

---

## Session Update - 2026-05-06 21:43:13 +07:00

### Task Done
- Added achievement toast notification when `/achievement` returns `newlyEarned`.

### Files Read
- `README.md`
- `HANDOFF.md`
- `replit.md`
- `artifacts/api-server/src/routes/achievement.ts`
- `artifacts/api-server/src/lib/achievements.ts`
- `artifacts/tu-tien-lo/src/lib/hooks.ts`
- `artifacts/tu-tien-lo/src/pages/achievement.tsx`
- `artifacts/tu-tien-lo/src/components/GameShell.tsx`

### Files Changed
- `artifacts/tu-tien-lo/src/components/GameShell.tsx`
- `HANDOFF.md`

### Logic New / Fixed
- Game shell now shows `Thành tựu mới: <name>!` toast for backend-reported newly earned achievements.
- Toast dedupe uses `sessionStorage` and keeps the last 50 achievement names to prevent repeated notification spam in the same browser session.
- Frontend still does not grant achievement rewards; reward claim remains server-authoritative via existing API.

### Commands Run
- `git fetch origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `58 passed / 0 failed / 58 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Toast dedupe is session-scoped, so the same newly earned achievement could toast again in a new browser session if backend returns it again.
- `/achievement` GET still has server-side side effects by auto-awarding newly met achievements.

### Next Recommended Tasks
- Consider making achievement check explicit or moving newly-earned events to action responses only.
- NPC affinity MVP is implemented; next step is cooldown/daily talk limit and dialogue unlocks.

---

## Session Update - 2026-05-06 22:07:59 +07:00

### Task Done
- Implemented NPC affinity MVP.

### Files Read
- `HANDOFF.md`
- `lib/db/src/schema/npcs.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/api-server/src/seed.ts`
- `artifacts/tu-tien-lo/src/pages/npc.tsx`
- `scripts/src/smoke-test.ts`

### Files Changed
- `lib/db/src/schema/npc_affinity.ts`
- `lib/db/src/schema/index.ts`
- `artifacts/api-server/src/lib/npcAffinity.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/tu-tien-lo/src/pages/npc.tsx`
- `scripts/src/smoke-test.ts`
- `HANDOFF.md`

### Logic New / Fixed
- Added `character_npc_affinity` schema table with unique `(char_id, npc_id)` index.
- Added server helper constants: talk gain `+2`, affinity cap `100`, rank thresholds.
- Added authenticated APIs:
  - `GET /npc/:npcId/affinity`
  - `POST /npc/:npcId/talk`
- NPC page now shows affinity and a server-backed `Trò chuyện` action.
- Smoke tests cover affinity gain, cap, negative input guard, and rank thresholds.

### Commands Run
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `63 passed / 0 failed / 63 total`
- PASS: `pnpm build` after the change.

### Known Risks
- Requires applying Drizzle schema push before the new NPC affinity APIs can run against an existing DB.
- No talk cooldown yet; affinity gain is capped but players can click repeatedly until cap.
- Affinity currently unlocks no new dialogue/quests; it is foundation state plus UI.

### Next Recommended Tasks
- Add talk cooldown or daily talk limit.
- Unlock extra NPC dialogue at affinity thresholds 20/50/80.
- Add quest gating or flavor text based on affinity rank.

---

## Session Update - 2026-05-06 22:21:57 +07:00

### Task Done
- Docs-only audit of `README.md` and `HANDOFF.md` against the current code state.
- Updated completed/remaining feature lists to reflect that skill combat MVP, 04:00 daily reset, achievement UI/toast, and NPC affinity MVP are already done.

### Files Read
- `README.md`
- `HANDOFF.md`
- `lib/db/src/schema/*`
- `artifacts/api-server/src/*`
- `artifacts/tu-tien-lo/src/*`
- `scripts/src/*`

### Files Changed
- `README.md`
- `HANDOFF.md`

### Logic New / Fixed
- No feature code changed.
- README now lists skill combat MVP, daily grind reset at 04:00, achievement page/badge/toast, and NPC affinity MVP as completed.
- README remaining work now focuses on active skill slots, NPC cooldown/dialogue unlocks, DB schema rollout, and future systems.
- HANDOFF top status, completed features, key files, known issues, and next tasks were synchronized with current repo state.

### Commands Run
- `git status --short --branch`
- `rg --files ...`
- `rg -n ... README.md HANDOFF.md`
- `pnpm typecheck`

### Test / Build Result
- PASS: `pnpm typecheck`
- Build not run because this was docs-only.

### Known Risks
- Existing DB environments still need Drizzle schema push/preflight before new schema constraints and `character_npc_affinity` are guaranteed available.
- Achievement GET side effect remains a technical-debt item.

### Next Recommended Tasks
- Add NPC talk cooldown/daily limit.
- Make achievement checking explicit or move newly-earned events to gameplay action responses.

---

## Session Update - 2026-05-06 23:24:13 +07:00

### Task Done
- Implemented NPC talk cooldown / daily talk limit.

### Files Read
- `HANDOFF.md`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/api-server/src/lib/npcAffinity.ts`
- `artifacts/api-server/src/lib/dailyReset.ts`
- `lib/db/src/schema/npc_affinity.ts`
- `artifacts/tu-tien-lo/src/pages/npc.tsx`
- `scripts/src/smoke-test.ts`

### Files Changed
- `artifacts/api-server/src/lib/npcAffinity.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/tu-tien-lo/src/pages/npc.tsx`
- `scripts/src/smoke-test.ts`
- `HANDOFF.md`

### Logic New / Fixed
- Added `getNpcTalkCooldownState()` using the existing 04:00 daily reset window.
- `GET /npc/:npcId/affinity` now returns `canTalk` and `nextTalkAt`.
- `POST /npc/:npcId/talk` now rejects same-window repeat talk with HTTP 429 and code `TALK_COOLDOWN`, including `nextTalkAt`.
- Successful talk response now returns `canTalk: false` and the next reset time.
- NPC page disables `Trò chuyện` when server says cooldown is active and shows remaining time beside the button.
- Frontend still only displays/calls APIs; affinity gain remains server-authoritative.

### Commands Run
- `git status --short --branch`
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`
- `pnpm build`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `66 passed / 0 failed / 66 total`
- PASS: `pnpm build`
- Note: Vite still reports the known frontend chunk size warning; build exits successfully.

### Known Risks
- Cooldown enforcement is based on the existing `last_talked_at` column, so existing DBs still need the NPC affinity schema applied.
- Current cooldown is one affinity gain per NPC per 04:00 reset window; no paid bypass or client-side reward logic was added.

### Next Recommended Tasks
- Unlock NPC dialogue/quest flavor at affinity thresholds 20/50/80.
- Consider adding a DB-level concurrency hardening pass for simultaneous duplicate talk requests if traffic grows.

---

## Session Update - 2026-05-06 23:35:43 +07:00

### Task Done
- Unlocked NPC dialogue and quest gating by affinity rank.

### Files Read
- `HANDOFF.md`
- `lib/db/src/schema/missions.ts`
- `lib/db/src/schema/npcs.ts`
- `artifacts/api-server/src/lib/npcAffinity.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/api-server/src/routes/mission.ts`
- `artifacts/api-server/src/seed.ts`
- `artifacts/tu-tien-lo/src/pages/npc.tsx`
- `scripts/src/smoke-test.ts`

### Files Changed
- `lib/db/src/schema/missions.ts`
- `artifacts/api-server/src/lib/npcAffinity.ts`
- `artifacts/api-server/src/routes/npc.ts`
- `artifacts/api-server/src/routes/mission.ts`
- `artifacts/api-server/src/seed.ts`
- `artifacts/tu-tien-lo/src/pages/npc.tsx`
- `scripts/src/smoke-test.ts`
- `HANDOFF.md`

### Logic New / Fixed
- Added `mission_templates.affinity_required` with default `0`; existing quests remain ungated.
- Added NPC affinity helpers for requirement checks, required rank mapping, and rank dialogue fallback.
- `GET /npc/:npcId/affinity` now returns rank-specific dialogue.
- `GET /npc/:npcId/quests` marks affinity-gated quests as `locked` with `affinityRequired`, `currentAffinity`, and `requiredRank`.
- `/mission` list also marks gated quests locked, and mission accept/complete rejects insufficient affinity with `AFFINITY_REQUIRED`.
- NPC page shows affinity rank, rank-specific dialogue, and quest affinity requirements.
- Seed adds three small affinity-gated NPC quests at 20/50/80 and links them to Mộc Thanh Y, Hàn Dạ, and Tô Nguyệt Ly.

### Commands Run
- `git status --short --branch`
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`
- `pnpm build`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `71 passed / 0 failed / 71 total`
- PASS: `pnpm build`
- Note: Vite chunk size warning remains known and non-blocking.

### Known Risks
- Existing DBs need Drizzle schema push before `affinity_required` exists.
- Seed uses `onConflictDoNothing` for new gated quests, then updates questId links and rank dialogue JSON for the three affected NPCs on rerun.

### Next Recommended Tasks
- Add richer dialogue/quest rewards at higher affinity ranks.
- Add migration/preflight documentation for applying `affinity_required` and NPC affinity tables in production.

---

## Session Update - 2026-05-07 00:21:44 +07:00

### Task Done
- Added active/equipped skill slots and combat skill usage summaries.

### Files Read
- `HANDOFF.md`
- `lib/db/src/schema/skills.ts`
- `artifacts/api-server/src/lib/skillCombat.ts`
- `artifacts/api-server/src/routes/skill.ts`
- `artifacts/api-server/src/routes/dungeon.ts`
- `artifacts/api-server/src/routes/boss.ts`
- `artifacts/tu-tien-lo/src/pages/skill.tsx`
- `artifacts/tu-tien-lo/src/pages/dungeon.tsx`
- `artifacts/tu-tien-lo/src/pages/boss.tsx`
- `scripts/src/smoke-test.ts`

### Files Changed
- `lib/db/src/schema/skills.ts`
- `artifacts/api-server/src/lib/skillCombat.ts`
- `artifacts/api-server/src/routes/skill.ts`
- `artifacts/api-server/src/routes/dungeon.ts`
- `artifacts/api-server/src/routes/boss.ts`
- `artifacts/tu-tien-lo/src/pages/skill.tsx`
- `artifacts/tu-tien-lo/src/pages/dungeon.tsx`
- `artifacts/tu-tien-lo/src/pages/boss.tsx`
- `scripts/src/smoke-test.ts`
- `HANDOFF.md`

### Logic New / Fixed
- Added nullable `character_skills.active_slot` for MVP active skill slots 1-3.
- Added `POST /skill/:skillId/equip` and `POST /skill/:skillId/unequip`.
- Equip guard rejects unknown slots and skills the character has not learned with `SKILL_NOT_LEARNED`.
- Combat remains server-authoritative. If any attack skill is active, dungeon/boss combat chooses only active attack skills by slot priority; otherwise it falls back to learned attack skills as before.
- Dungeon response now includes `skillUsed` and `skillUsage` with casts, MP consumed, cooldown rounds, and remaining MP.
- Boss response now includes richer `skillUsed` with MP consumed, cooldown rounds, log, and remaining MP.
- Skill page can assign learned skills to active slots and unequip them.
- Dungeon/Boss UI shows skill usage summaries from server response only; no client-side damage calculation was added.

### Commands Run
- `git status --short --branch`
- `git pull origin main`
- `pnpm typecheck`
- `pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts`
- `pnpm build`

### Test / Build Result
- PASS: `pnpm typecheck`
- PASS: smoke test, `73 passed / 0 failed / 73 total`
- PASS: `pnpm build`
- Note: known Vite chunk size warning remains non-blocking.

### Known Risks
- Existing DBs need Drizzle schema push before `active_slot` exists.
- Active skill cooldown is still per combat request/round, not persisted between separate boss attack requests.

### Next Recommended Tasks
- Add a small active-skill panel to Dungeon/Boss pages so players see equipped skills before entering combat.
- Add DB preflight/migration docs for `active_slot`, `affinity_required`, and NPC affinity tables.
