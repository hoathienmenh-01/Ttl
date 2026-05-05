# HANDOFF — Tu Tiên Lộ: Hoa Thiên Khai Đạo

## Current Status: CORE GAMEPLAY POLISH PHASE ✅

Ngày cập nhật: 2026-05-03
Phiên AI: Build session 8 — Linh Căn + Ngũ Hành gameplay polish

---

## Completed Features

### Infrastructure
- [x] pnpm monorepo: `artifacts/api-server` + `artifacts/tu-tien-lo` + `lib/db`
- [x] PostgreSQL + Drizzle ORM (15 bảng)
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
- [x] Tu luyện nhập định (EXP tích lũy theo thời gian thực, server-authoritative)
- [x] Đột phá cảnh giới (21 cảnh giới, server-authoritative)
- [x] Boss thế giới với shared HP pool
- [x] Bí cảnh 6 loại — server tính toàn bộ combat, ngũ hành modifier + final boss floor
- [x] Pháp thuật 7 loại theo ngũ hành — học tốn Linh Thạch
- [x] Quest: 17 nhiệm vụ (main/realm/sect/npc/grind), double-claim protected
- [x] NPC: 6 NPC với dialogue và quest riêng
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
| `artifacts/api-server/src/lib/economyLog.ts` | logEconomy() helper — ghi economy_logs |
| `artifacts/api-server/src/lib/battlePassXp.ts` | grantBattlePassXp() — upsert battle_pass_progress |
| `artifacts/api-server/src/routes/battle-pass.ts` | GET /battle-pass + POST /battle-pass/claim/:tier |
| `artifacts/api-server/src/routes/economy-log.ts` | GET /economy-log + GET /economy-log/admin |
| `artifacts/api-server/src/routes/character.ts` | daily-reward với 7-day streak + economy log |
| `artifacts/api-server/src/routes/dungeon.ts` | Dungeon combat + final boss + economy log |
| `artifacts/api-server/src/routes/boss.ts` | Boss combat + economy log + pass XP |
| `artifacts/api-server/src/routes/mission.ts` | Mission complete + economy log + pass XP |
| `artifacts/api-server/src/seed.ts` | Battle pass season "Mùa 1 — Khai Thiên" seeded |
| `lib/db/src/schema/battle_pass.ts` | battlePassSeasonsTable + battlePassProgressTable + BattlePassTier |
| `lib/db/src/schema/economy_logs.ts` | economyLogsTable |
| `lib/db/src/schema/characters.ts` | loginStreak + loginStreakUpdatedAt columns |
| `artifacts/tu-tien-lo/src/pages/battle-pass.tsx` | Battle Pass UI — tiers, XP bar, claim |
| `artifacts/tu-tien-lo/src/pages/economy-log.tsx` | Lịch Sử Kinh Tế UI — transaction log |
| `artifacts/tu-tien-lo/src/lib/hooks.ts` | useBattlePass, useClaimBattlePassTier, useEconomyLog |
| `artifacts/tu-tien-lo/src/components/GameShell.tsx` | Nav: Battle Pass + Lịch Sử added |

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

---

## Next Recommended Tasks (Ưu tiên cao → thấp)

### P8 — NPC relationship system
- [ ] NPC affinity tracking — `npc_affinity` table, POST /npc/:id/talk tăng điểm
- [ ] Unlock new dialogue at affinity thresholds (10, 25, 50)
- [ ] Affinity bar trong NPC page
- [ ] Cần DB migration: thêm bảng `character_npc_affinity`

### P9 — Content expansion
- [ ] Thêm quest cho Kim Đan và Nguyên Anh tier (chỉ sửa seed.ts + re-seed)
- [ ] More alchemy recipes (cao cấp hơn)
- [ ] Thêm item drops từ boss

### P10 — Social & Economy
- [ ] PvP arena (challenge/duel, betting)
- [ ] Achievement notification popup
- [ ] Auction marketplace (bid thay vì mua ngay)

### P11 — Monthly Card Mock
- [ ] 30-day "Nguyệt Thẻ Thường" — +50 LS/ngày điểm danh, design-only (mock)
- [ ] Hiển thị badge "Thẻ Hoạt Động" trên character card
- [ ] Cần thêm `monthly_card_active_until` column trên characters

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
