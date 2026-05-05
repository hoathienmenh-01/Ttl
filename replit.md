# Tu Tiên Lộ — Vietnamese Cultivation Browser Game

## Overview
A full-stack browser RPG set in a Vietnamese xianxia/cultivation universe. Players register, roll a spiritual root, and progress through 21 cultivation realms from Phàm Nhân (mortal) to Hư Không Chí Tôn (void supreme). Features real-time cultivation meditation, boss battles, dungeons, missions, achievement system, alchemy crafting, daily login rewards, sect politics, player market, and chat.

## Architecture

### Monorepo Layout
```
artifacts/
  api-server/        — Express 5 + Drizzle ORM backend (port 8080, path /api)
  tu-tien-lo/        — React + Vite frontend (port 23188, path /)
lib/
  db/                — Drizzle schema + migrations (PostgreSQL)
scripts/             — Utility scripts
```

### Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Wouter routing, TanStack Query, Sonner toasts
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, Pino logging
- **Auth**: Simple base64url token (userId:timestamp:SECRET), stored in localStorage as `tienlo_token`

## Database Schema (lib/db/src/schema/)
- `users` — email, passwordHash, username, role (player/mod/admin), banned
- `characters` — full character sheet: realm, EXP, stats, currencies, cultivation state, dungeonClears, bossKills, alchemyCrafts, lastDailyClaimAt
- `item_templates` — master item definitions (weapon, armor, pill, herb, ore, accessory, misc)
- `inventory_items` — per-character item instances (qty, enhanceLv, equipped, slot)
- `boss_templates` — boss definitions (element, HP, drops, zone, worldBoss flag)
- `boss_spawns` — live boss instances with shared HP pool
- `boss_attack_logs` — per-attack record
- `mission_templates` — 25 missions with `objectiveType` column (dungeon_clear, boss_kill, alchemy_craft, cultivate, breakthrough, or null for manual)
- `mission_progress` — per-character progress tracking (status: available/accepted/completed/claimed)
- `dungeon_templates` — dungeon definitions (stages, monsters, element, minRealm, difficulty)
- `achievement_templates` — static achievement definitions (conditionType, conditionValue, rewards)
- `character_achievements` — per-character earned/claimed achievements
- `alchemy_recipes` — crafting recipes (inputItems JSON, outputItem, successRate, linhThachCost)
- `chat_messages` — world/sect/private channel messages
- `sects` — cultivation sects with treasury, members, leader
- `npcs` — NPC definitions with dialogue and questIds
- `skill_templates` — learnable skills (element, type, damage/heal multipliers)
- `character_skills` — per-character learned skills
- `market_listings` — player-to-player item listings
- `topup_requests` — VND → Tiên Ngọc conversion requests (pending/approved/rejected)

## Cultivation System
- 21 realms: Phàm Nhân → Luyện Khí (9 stages) → Trúc Cơ (9) → Kim Đan (9) → Nguyên Anh (9) → ...
- Cultivation ticks every 5s when `cultivating=true`, granting EXP based on realm tier and spiritual root grade
- Breakthrough requires `exp >= expRequired` and Linh Thạch cost
- Passive stamina regen: +10 stamina every 30 min
- Rest cooldown: 120 seconds

## Spiritual Root System
- Elements: kim, moc, thuy, hoa, tho, loi, phong, bang, doc, am, duong
- Grades: common (65%), good (25%), rare (8%), epic (1.8%)

## Authentication
- Token format: `base64url(userId:timestamp:SESSION_SECRET)`
- Frontend stores token in `localStorage["tienlo_token"]`
- All API requests send `Authorization: Bearer <token>`

## API Routes
| Group | Routes |
|-------|--------|
| Auth | POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me |
| Character | GET /character, POST /character, GET /character/stats, GET /character/online, GET /character/inspect/:id, POST /character/rest, POST /character/daily-reward |
| Cultivation | POST /cultivation/start, POST /cultivation/stop, POST /cultivation/breakthrough, GET /cultivation/realms |
| Inventory | GET /inventory, POST /inventory/:id/use, POST /inventory/:id/equip, POST /inventory/:id/unequip, POST /inventory/:id/sell |
| Boss | GET /boss, POST /boss/:id/attack |
| Dungeon | GET /dungeon, POST /dungeon/:id/enter |
| Mission | GET /mission, POST /mission/:id/accept, POST /mission/:id/complete |
| Achievement | GET /achievement, POST /achievement/:id/claim |
| Alchemy | GET /alchemy/recipes, POST /alchemy/craft/:recipeId |
| NPC | GET /npc |
| Skill | GET /skill, POST /skill/:id/learn |
| Chat | GET /chat/messages, POST /chat/send |
| Sect | GET /sect, GET /sect/mine, POST /sect/:id/join |
| Market | GET /market, POST /market/list, POST /market/:id/buy |
| Leaderboard | GET /leaderboard |
| Topup | POST /topup/request, GET /topup/history |
| Admin | GET /admin/stats, GET /admin/players, GET /admin/topup, POST /admin/topup/:id/approve |

## Achievement System
Checked automatically after key actions (dungeon clear, boss kill, breakthrough, skill learn, alchemy craft).
- Condition types: `dungeon_clear`, `boss_kill`, `quest_complete`, `breakthrough_realm`, `skill_learn`, `level`, `alchemy_craft`
- Rewards: Linh Thạch + optional title
- 24 achievements seeded across 6 categories: combat, cultivation, social, skill, alchemy, misc

## Alchemy System
- 8 recipes: basic (100% success) → advanced (60% success)
- Consumes items from inventory + Linh Thạch
- Tracks `alchemyCrafts` counter on character for achievement checking

## Daily Login Reward
- POST /character/daily-reward resets at 04:00 server local time
- Awards: +100 Linh Thạch + 1x Hồi Khí Đan
- `lastDailyClaimAt` tracked on character

## Seed Data
Run `cd artifacts/api-server && npx tsx src/seed.ts` to seed:
- 19 item templates (weapons, armor, pills, herbs, ores, accessories)
- 7 skill templates
- 6 dungeon templates (Phàm Nhân → Trúc Cơ difficulty)
- 5 boss templates
- 25 mission templates (Phàm Nhân → Nguyên Anh tiers)
- 6 NPCs (Lăng Vân Sinh, Mộc Thanh Y, Hàn Dạ, Tô Nguyệt Ly, Chấp Sự Hoa Thiên, Bảng Nhiệm Vụ)
- 5 sects
- 24 achievement templates
- 8 alchemy recipes
- Admin user: admin@tutienlo.vn / admin123456

## Frontend Pages
- `/auth` — Login/Register with dark cultivation aesthetic
- `/create-character` — Character creation + spiritual root roll reveal
- `/` — Character overview, daily reward button, EXP bar, cultivation toggle
- `/cultivation` — Realm progression chart, breakthrough button
- `/dungeon` — Bí cảnh dungeon runs with stamina cost and loot
- `/boss` — Boss grid with shared HP bars, combat log modal
- `/mission` — Tabbed mission list (main/realm/sect/npc/grind)
- `/npc` — NPC dialogue and quest hub
- `/skill` — Learnable skills list with element/type filters
- `/achievement` — Achievement gallery with claim rewards
- `/alchemy` — Luyện đan crafting UI with ingredient checker
- `/inventory` — Item grid with quality-colored cards, equip/use/sell
- `/chat` — World/Sect/Private channels, auto-refresh every 5s
- `/sect` — Sect list with join button
- `/market` — Player market listings with buy button
- `/leaderboard` — Power/Realm/PvP tabs
- `/topup` — Bank transfer instructions + request form + history
- `/admin` — Stats dashboard, player list, topup approval queue
- `/online` — Live online players grid
- `/guide` — Game guide

## Achievement Checker
`artifacts/api-server/src/lib/achievements.ts` — `checkAndAwardAchievements(charId)` is called after:
- Dungeon victory (dungeon.ts)
- Boss kill (boss.ts)
- Cultivation breakthrough (cultivation.ts)
- Alchemy craft success (alchemy.ts)

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Token signing secret
- `PORT` — Server port (set by workflow)
