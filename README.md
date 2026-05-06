# Tu Tiên Lộ — Hoa Thiên Khai Đạo

Game tu tiên web browser RPG lấy cảm hứng từ tiểu thuyết tiên hiệp Việt Nam. Người chơi bắt đầu là một phàm nhân được Hoa Thiên Môn thu nhận, từng bước tu luyện, đột phá cảnh giới, chinh phục bí cảnh, hoàn thành nhiệm vụ NPC và trở thành cường giả.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Routing | Wouter |
| State | TanStack Query |
| Forms | react-hook-form + Zod |
| Styling | Tailwind CSS (dark cultivation theme) |
| Notifications | Sonner |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL (Drizzle ORM) |
| Logging | Pino |
| Monorepo | pnpm workspaces |

## Tính năng MVP đã hoàn thiện

### Core Loop
- [x] Đăng ký / đăng nhập
- [x] Tạo nhân vật với linh căn roll (common 65% / good 25% / rare 8% / epic 2%)
- [x] Ngũ hành chính (Kim / Mộc / Thủy / Hỏa / Thổ)
- [x] Linh căn ảnh hưởng EXP / combat / kỹ năng nhẹ
- [x] Tu luyện nhập định (server-authoritative, EXP tích lũy theo thời gian thực)
- [x] Đột phá cảnh giới (21 cảnh giới từ Phàm Nhân → Hư Không Chí Tôn)

### Quest & NPC
- [x] 6 NPC với dialogue và nhiệm vụ riêng: Lăng Vân Sinh, Mộc Thanh Y, Hàn Dạ, Tô Nguyệt Ly, Chấp Sự Hoa Thiên, Bảng Nhiệm Vụ
- [x] 27 nhiệm vụ (main, realm, sect, npc, grind), gồm content Kim Đan/Nguyên Anh và 6 NPC affinity-gated quest
- [x] Double-claim protection (server-side)
- [x] Quest phân loại theo NPC
- [x] Daily grind quest reset theo mốc 04:00 server local time
- [x] NPC affinity MVP: điểm thân thiết, cấp quan hệ, API trò chuyện, UI hiển thị/tăng affinity
- [x] NPC talk cooldown theo reset window 04:00
- [x] Dialogue và quest gating theo affinity rank (`xa_la`, `quen_biet`, `than_thiet`, `tri_ky`)

### Bí Cảnh / Chiến Đấu
- [x] 6 bí cảnh (Thanh Khê Cốc → Âm Linh Điện)
- [x] Server tính toán toàn bộ combat — frontend chỉ nhận kết quả
- [x] Ngũ hành tương khắc: +30% sát thương / -25% sát thương
- [x] Ngũ hành tương sinh: bonus nhẹ khi hệ phù hợp
- [x] Skill combat MVP: kỹ năng đã học được server dùng trong dungeon/boss combat, có MP cost, cooldown trong lượt và cap sát thương
- [x] Boss thế giới (shared HP pool)
- [x] Drop item có xác suất

### Stamina System
- [x] Stamina bar hiển thị sidebar + trang Bí Cảnh
- [x] Dungeon tiêu hao thể lực: Dễ -6, TB -10, Khó -16
- [x] Nghỉ Ngơi: hồi 40% HP và +30 TL
- [x] **Rest cooldown 2 phút** — server enforce, client đếm ngược real-time
- [x] **Stamina passive regen** — +10 TL mỗi 30 phút (tự động, không cần action)

### Pháp Thuật
- [x] 7 pháp thuật theo ngũ hành (Kim Quang Trảm, Thanh Mộc Hồi Xuân, Thủy Tiên, Hỏa Cầu, Thổ Thuẫn, Lôi Bạt, Băng Phong)
- [x] Học pháp thuật tốn Linh Thạch (server-authoritative)
- [x] Không học trùng
- [x] Pháp thuật đã học ảnh hưởng combat server-side; frontend chỉ hiển thị log/kết quả
- [x] Active/equipped skill slots MVP: 3 ô active, guard skill chưa học, combat ưu tiên active skill server-side

### Inventory & Items
- [x] 39 item templates (vũ khí, giáp, đan dược, thảo dược, quặng, phụ kiện, linh phù)
- [x] Trang bị / gỡ trang bị / dùng consumable / bán
- [x] Không thể bán âm

### Tông Môn & Xã Hội
- [x] 5 tông môn (Hoa Thiên Môn là tông môn chính)
- [x] Phiên chợ người chơi
- [x] Chat world/sect/private
- [x] Bảng xếp hạng
- [x] Nạp tiền (thủ công, admin duyệt)

### Achievement
- [x] Achievement catalog + tiến độ/thành tựu server-side
- [x] Trang thành tựu với claim reward server-authoritative
- [x] Sidebar badge khi có thành tựu nhận thưởng được
- [x] Toast thông báo thành tựu mới khi backend trả `newlyEarned`

### Admin
- [x] Dashboard thống kê
- [x] Quản lý người chơi
- [x] Duyệt nạp tiền

## Cách Chạy

### Yêu cầu
- Node.js 20+
- PostgreSQL (hoặc Replit Database tự động)
- pnpm

### Cài đặt
```bash
pnpm install
```

### Chạy dev
```bash
# API Server (port 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (port auto)
pnpm --filter @workspace/tu-tien-lo run dev
```

Trên Replit: workflows đã được cấu hình tự động.

### Push DB Schema
```bash
cd lib/db && npx drizzle-kit push
```

### Seed Database
```bash
cd artifacts/api-server && npx tsx src/seed.ts
```

### Smoke Test
```bash
npx tsx scripts/src/smoke-test.ts
```

## Cấu Trúc Thư Mục

```
artifacts/
  api-server/
    src/
      routes/         — 16 route files (auth, character, cultivation, boss, mission, npc, skill, dungeon, ...)
      middlewares/    — auth.ts (token validation)
      lib/            — realms.ts (21 cảnh giới), elements (5 hệ)
      seed.ts         — Seed dữ liệu mẫu
  tu-tien-lo/
    src/
      pages/          — 17 trang (home, cultivation, dungeon, boss, mission, npc, skill, inventory, ...)
      components/     — GameShell layout
      lib/            — hooks.ts, api.ts, constants.ts
lib/
  db/
    src/schema/       — schema modules cho users, characters, inventory, bosses, missions, chat, sects, market, topup, npcs, skills, achievements, npc_affinity, ...
    migrations/       — Drizzle migrations
scripts/
  src/smoke-test.ts   — Smoke test cơ bản
```

## Dữ Liệu Mẫu

| Loại | Số lượng |
|------|----------|
| Item templates | 39 |
| Boss templates | 5 |
| Dungeon templates | 6 |
| Skill templates | 7 |
| Mission templates | 27 |
| Sects | 5 |
| NPCs | 6 |

**Admin account**: `admin@tutienlo.vn` / `admin123456`

## API Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/character
POST /api/character
POST /api/cultivation/start
POST /api/cultivation/stop
POST /api/cultivation/breakthrough
GET  /api/cultivation/realms
GET  /api/dungeon
POST /api/dungeon/:id/enter         ← server resolves combat
GET  /api/boss
POST /api/boss/:id/attack
GET  /api/mission
POST /api/mission/:id/accept
POST /api/mission/:id/complete      ← double-claim protected
GET  /api/npc
GET  /api/npc/:id
GET  /api/npc/:id/quests
GET  /api/npc/:id/affinity
POST /api/npc/:id/talk
GET  /api/skill/catalog
GET  /api/skill/mine
POST /api/skill/:id/learn
POST /api/skill/:id/equip
POST /api/skill/:id/unequip
GET  /api/achievement
POST /api/achievement/:id/claim
GET  /api/inventory
POST /api/inventory/:id/use
POST /api/inventory/:id/equip
POST /api/inventory/:id/sell
GET  /api/sect
POST /api/sect/:id/join
GET  /api/market
POST /api/market/list
POST /api/market/:id/buy
GET  /api/leaderboard
POST /api/topup/request
GET  /api/admin/stats
GET  /api/admin/players
POST /api/admin/topup/:id/approve
```

## Gameplay Safety

- **Frontend chỉ render và gửi action** — không tự cộng EXP, linh thạch, item
- **Server-authoritative**: cultivation, breakthrough, quest reward, combat, loot, inventory
- **Double-claim protection**: mission reward claim dùng server state/transaction guard, claimed → không claim được lại
- **Daily reset 04:00**: daily grind quest và daily login dùng cùng reset window server-side
- **Skill combat server-side**: dungeon/boss tự chọn skill hợp lệ đã học, trừ MP và cap damage trên server
- **Active skill guard**: server chỉ cho equip skill đã học; frontend chỉ chọn slot và hiển thị kết quả
- **Currency không âm**: bán item không thể để linh thạch âm
- **Realm check**: bí cảnh cần đúng cảnh giới mới vào được

## DB Rollout / Production Preflight

Schema mới cần rollout trên DB thật:
- `character_skills.active_slot`
- `mission_templates.affinity_required`
- `character_npc_affinity`

Checklist:
```bash
pnpm run typecheck:libs
cd lib/db && pnpm run push-force
cd artifacts/api-server && npx tsx src/seed.ts
pnpm typecheck
pnpm --filter @workspace/scripts exec tsx src/smoke-test.ts
pnpm build
```

## Việc Còn Lại

- [ ] Apply DB rollout/preflight trên môi trường thật cho `active_slot`, `affinity_required`, `character_npc_affinity`
- [ ] Active skill panel nhỏ trên Dungeon/Boss trước khi vào combat
- [ ] Richer affinity dialogue/reward ở các mốc thân thiết cao hơn
- [ ] More alchemy recipes cao cấp cho Kim Đan/Nguyên Anh
- [ ] Pet / Companion system
- [ ] PvP arena
- [ ] Guild war
- [ ] Achievement event flow rõ hơn: tránh side effect trên `GET /achievement` nếu tách được sang action responses
- [ ] More dungeon bosses per floor
- [ ] Enhanced market (auction, bidding)
