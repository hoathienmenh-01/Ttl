# PHẦN 4 — STACK CÔNG NGHỆ, CẤU TRÚC THƯ MỤC, DATA MODEL, API

> Đây là phần dành cho lập trình viên / AI coder. Đủ để khởi tạo skeleton repo và sinh code.

---

## 1. STACK ĐỀ XUẤT (KHỚP VỚI BUNDLE GỐC)

### 1.1 Frontend
- **Vue 3** (Composition API, `<script setup>`) — bằng chứng: bundle có `useState`, `defineComponent`,
  Pinia (`V4("game", …)`, `V4("gameToast", …)`), Vue Router (`pathMatch(.*)`, `currentRoute`).
- **Pinia** — state management.
- **Vue Router 4** — code-split per route (`./auth-*.js`, `./register-*.js`…).
- **Vite** — build tool (asset hashing rõ ràng: `index-ipxi58iD.js`).
- **TypeScript**.
- **Tailwind CSS** + custom design tokens (m-* utilities), hoặc **UnoCSS**.
- **Workbox** — service worker (PWA, offline fallback).
- **socket.io-client** hoặc **native WebSocket** với reconnect.
- **Axios** cho REST (interceptor xử lý 401 → /auth).
- **vee-validate + zod** cho form validate.
- **floating-ui** cho tooltip / popover.
- **lottie-web** cho animation lò luyện đan / thiên kiếp.

### 1.2 Backend
- **Node.js 20+** + **NestJS** (modular, decorator, dễ chia REST/WS/Cron) hoặc **Fastify** (nhẹ).
- **PostgreSQL 16** — DB chính.
- **Redis 7** — session, online list, rate limit, leaderboard sorted set.
- **BullMQ** — queue (email, sự kiện, boss spawn).
- **Prisma** ORM hoặc **Drizzle**.
- **Argon2id** cho password hashing.
- **JWT** access (15 phút) + refresh token (httpOnly cookie, 30 ngày).
- **Zod** validate input toàn server.
- **Pino** logging.

### 1.3 Hạ tầng
- **Docker Compose** cho dev (postgres, redis, minio, mailhog).
- **CI**: GitHub Actions — lint + test + build + docker push.
- **Hosting đề xuất**:
  - Frontend: Cloudflare Pages / Vercel.
  - Backend: Fly.io / Railway / VPS Hetzner.
  - DB: Neon / Supabase / Postgres tự host.
  - Object storage: Cloudflare R2 / S3 / MinIO (avatar đạo lữ, art boss).

---

## 2. CẤU TRÚC THƯ MỤC

```
mongtutien-clone/
├── apps/
│   ├── web/                                   # Vue 3 SPA + PWA
│   │   ├── public/
│   │   │   ├── icon.png
│   │   │   ├── favicon_io/
│   │   │   ├── background/
│   │   │   │   ├── auth-bg.webp
│   │   │   │   └── loader.jpg
│   │   │   └── manifest.webmanifest
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── App.vue
│   │   │   ├── router/
│   │   │   │   └── index.ts
│   │   │   ├── stores/                       # Pinia
│   │   │   │   ├── auth.ts
│   │   │   │   ├── game.ts                   # giant store, mirror bundle gốc
│   │   │   │   ├── toast.ts                  # gameToast clone
│   │   │   │   ├── topup.ts
│   │   │   │   └── chat.ts
│   │   │   ├── api/
│   │   │   │   ├── client.ts                 # axios instance + interceptor
│   │   │   │   ├── auth.ts
│   │   │   │   ├── character.ts
│   │   │   │   ├── inventory.ts
│   │   │   │   ├── mail.ts
│   │   │   │   └── admin.ts
│   │   │   ├── ws/
│   │   │   │   ├── socket.ts
│   │   │   │   └── handlers.ts
│   │   │   ├── design/
│   │   │   │   ├── tokens.css
│   │   │   │   ├── m-cursor.css
│   │   │   │   ├── m-progress.css
│   │   │   │   └── m-model.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                       # M-* primitives
│   │   │   │   │   ├── MButton.vue
│   │   │   │   │   ├── MModal.vue
│   │   │   │   │   ├── MProgressLeaf.vue
│   │   │   │   │   ├── MLoading.vue
│   │   │   │   │   └── MToast.vue
│   │   │   │   ├── shell/
│   │   │   │   │   ├── GameShell.vue         # layout 3 cột
│   │   │   │   │   ├── Topbar.vue
│   │   │   │   │   ├── Sidebar.vue
│   │   │   │   │   └── ChatDock.vue
│   │   │   │   ├── home/                     # GameHome
│   │   │   │   ├── map/                      # GameMap, BossList, MysticDungeons, SectConvoy
│   │   │   │   ├── inventory/                # GameInventory, ArtifactPanel
│   │   │   │   ├── mission/                  # GameMission
│   │   │   │   ├── alchemy/                  # GameAlchemy
│   │   │   │   ├── refinery/                 # GameRefinery
│   │   │   │   ├── social/                   # PetPanel, WifePanel, TienDuyenPanel
│   │   │   │   ├── arena/                    # GameArena, RivalryView
│   │   │   │   ├── activities/               # GameActivities, các *Main
│   │   │   │   ├── cultivation/              # CultivationMethodPanel, PathOfDaoView
│   │   │   │   ├── tutorial/                 # Onboarding, GameTutorial
│   │   │   │   ├── market/                   # Market
│   │   │   │   └── mail/
│   │   │   ├── views/                        # Route-level pages
│   │   │   │   ├── AuthView.vue
│   │   │   │   ├── HomeView.vue              # game shell + child route
│   │   │   │   ├── TopupView.vue
│   │   │   │   ├── CheckInventoryView.vue
│   │   │   │   ├── OnlineInspectorView.vue
│   │   │   │   ├── WivesWithDraftView.vue
│   │   │   │   ├── NotFoundView.vue
│   │   │   │   └── admin/
│   │   │   │       ├── AdminLayout.vue
│   │   │   │       ├── DashboardView.vue
│   │   │   │       ├── GiftcodesView.vue
│   │   │   │       ├── MailView.vue
│   │   │   │       ├── PlayersView.vue
│   │   │   │       ├── EquipmentIdentityView.vue
│   │   │   │       ├── RuntimeMetricsView.vue
│   │   │   │       └── TopupView.vue
│   │   │   ├── content/                      # JSON tĩnh
│   │   │   │   ├── realms.json               # 28 cảnh giới × 9 trọng (xem file 03)
│   │   │   │   ├── titles.json               # xưng hiệu mốc
│   │   │   │   ├── proverbs.json             # 7 câu thiền tab Đăng Nhập
│   │   │   │   ├── skills.json
│   │   │   │   ├── items.seed.json
│   │   │   │   └── i18n/vi.json
│   │   │   ├── assets/
│   │   │   │   ├── bg-auth.webp
│   │   │   │   ├── ink-frame.svg
│   │   │   │   └── icons/
│   │   │   └── env.d.ts
│   │   ├── index.html
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── api/                                   # NestJS / Fastify
│       ├── src/
│       │   ├── main.ts
│       │   ├── modules/
│       │   │   ├── auth/         (register/login/refresh/change-pw)
│       │   │   ├── character/    (me, breakthrough, cultivate-tick)
│       │   │   ├── inventory/    (use, equip, sell, search-by-name)
│       │   │   ├── mission/
│       │   │   ├── boss/
│       │   │   ├── arena/
│       │   │   ├── chat/
│       │   │   ├── mail/
│       │   │   ├── market/
│       │   │   ├── topup/
│       │   │   ├── giftcode/
│       │   │   ├── sect/
│       │   │   ├── pet/
│       │   │   ├── wife/
│       │   │   ├── alchemy/
│       │   │   ├── refinery/
│       │   │   ├── event/
│       │   │   ├── leaderboard/
│       │   │   └── admin/
│       │   ├── ws/
│       │   │   ├── game.gateway.ts
│       │   │   └── chat.gateway.ts
│       │   ├── workers/
│       │   │   ├── boss-spawner.cron.ts
│       │   │   ├── stamina-regen.cron.ts
│       │   │   ├── arena-settle.cron.ts
│       │   │   └── event-scheduler.cron.ts
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   └── common/
│       │       ├── guards/
│       │       ├── pipes/
│       │       └── filters/
│       └── test/
│
├── packages/
│   └── shared/                                # Type chia sẻ FE/BE (zod schema)
│       ├── src/
│       │   ├── enums.ts
│       │   ├── realms.ts                      # const REALMS = [...]
│       │   ├── ws-events.ts
│       │   └── api-contracts.ts
│       └── package.json
│
├── infra/
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── nginx/
│
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 3. DATA MODEL (PRISMA SCHEMA — RÚT GỌN)

```prisma
// schema.prisma

datasource db { provider = "postgresql" url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(PLAYER)
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
  banned       Boolean  @default(false)
  character    Character?
  topups       Topup[]
}

enum Role { PLAYER MOD ADMIN }

model Character {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields:[userId], references:[id])
  name            String   @unique
  realmKey        String   // ví dụ "kim_dan"
  realmStage      Int      // 1..9
  title           String?  // "Hư Không Chí Tôn"
  exp             BigInt   @default(0)
  level           Int      @default(1)

  // chỉ số chính
  hp              Int      @default(100)
  hpMax           Int      @default(100)
  mp              Int      @default(50)
  mpMax           Int      @default(50)
  stamina         Int      @default(100)
  staminaMax      Int      @default(100)
  power           Int      @default(10)
  spirit          Int      @default(10)
  speed           Int      @default(10)
  luck            Int      @default(5)
  daoVan          Int      @default(0)

  // currencies
  linhThach       BigInt   @default(0)
  tienNgoc        Int      @default(0)
  tienNgocKhoa    Int      @default(0)
  tienTe          Int      @default(0)
  nguyenThach     Int      @default(0)
  congHien        Int      @default(0)
  congDuc         Int      @default(0)
  chienCongTongMon Int     @default(0)

  settings        Json     @default("{}")
  sectId          String?
  sect            Sect?    @relation(fields:[sectId], references:[id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  inventory       InventoryItem[]
  equipped        EquippedItem[]
  pets            Pet[]
  wives           Wife[]
  arenaRecord    ArenaRecord?
  cultivationLogs CultivationLog[]
  missions        MissionProgress[]
  mails           Mail[]
}

model Sect {
  id          String   @id @default(cuid())
  name        String   @unique
  level       Int      @default(1)
  treasuryLinhThach BigInt @default(0)
  characters  Character[]
  createdAt   DateTime @default(now())
}

model ItemTemplate {
  id          String   @id
  name        String
  quality     Quality
  type        ItemType
  baseStats   Json     // {power:5, speed:2}
  iconUrl     String
  description String
}

enum Quality   { PHAM LINH HUYEN TIEN THAN }
enum ItemType  { WEAPON ARMOR BELT BOOTS HAT TRAM PILL HERB ORE KEY ARTIFACT MISC }

model InventoryItem {
  id          String   @id @default(cuid())
  charId      String
  char        Character @relation(fields:[charId], references:[id])
  templateId  String
  template    ItemTemplate @relation(fields:[templateId], references:[id])
  qty         Int      @default(1)
  enhanceLv   Int      @default(0)
  affixes     Json?
  createdAt   DateTime @default(now())
}

model EquippedItem {
  id          String   @id @default(cuid())
  charId      String
  slot        EquipSlot
  inventoryId String   @unique
  char        Character @relation(fields:[charId], references:[id])
}

enum EquipSlot { WEAPON ARMOR BELT BOOTS HAT TRAM ARTIFACT_1 ARTIFACT_2 ARTIFACT_3 }

model Pet      { id String @id @default(cuid()) charId String element String name String level Int @default(1) skills Json char Character @relation(fields:[charId], references:[id]) }
model Wife     { id String @id @default(cuid()) charId String name String avatarUrl String draftAvatarUrl String? bond Int @default(0) char Character @relation(fields:[charId], references:[id]) }

model BossInstance {
  id        String  @id @default(cuid())
  bossKey   String
  mapKey    String
  hp        BigInt
  hpMax     BigInt
  difficulty Difficulty
  spawnedAt DateTime @default(now())
  endedAt   DateTime?
  killedBy  String?
}
enum Difficulty { THUONG KHO AC_MONG BAO_TAU }

model Mail {
  id        String   @id @default(cuid())
  charId    String
  fromName  String   @default("Thiên Đạo Sứ Giả")
  title     String
  body      String
  rewards   Json?    // [{templateId, qty}]
  isRead    Boolean  @default(false)
  isClaimed Boolean  @default(false)
  createdAt DateTime @default(now())
  expiresAt DateTime?
  char      Character @relation(fields:[charId], references:[id])
}

model ChatMessage {
  id       String  @id @default(cuid())
  channel  String  // "world" | "sect:<id>" | "private:<a>:<b>"
  fromId   String
  fromName String
  text     String
  createdAt DateTime @default(now())
}

model Topup {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields:[userId], references:[id])
  amountVnd   Int
  tienNgoc    Int
  status      TopupStatus @default(PENDING)
  txnRef      String   @unique           // "MTT-<USER_ID>-<RANDOM6>"
  createdAt   DateTime @default(now())
  approvedAt  DateTime?
}
enum TopupStatus { PENDING APPROVED REJECTED }

model GiftCode {
  code      String   @id
  rewards   Json
  usesLeft  Int
  expiresAt DateTime?
  createdAt DateTime @default(now())
}

model GiftCodeRedemption {
  id      String @id @default(cuid())
  code    String
  charId  String
  redeemedAt DateTime @default(now())
  @@unique([code, charId])
}

model CultivationLog {
  id      String @id @default(cuid())
  charId  String
  text    String
  type    String   // "info" | "success" | "warning" | "system"
  createdAt DateTime @default(now())
  char    Character @relation(fields:[charId], references:[id])
}

model MissionProgress {
  id        String @id @default(cuid())
  charId    String
  missionKey String
  progress  Int   @default(0)
  claimed   Boolean @default(false)
  resetAt   DateTime?
  char      Character @relation(fields:[charId], references:[id])
  @@unique([charId, missionKey])
}

model ArenaRecord {
  id      String @id @default(cuid())
  charId  String @unique
  rank    Int
  rating  Int @default(1500)
  wins    Int @default(0)
  losses  Int @default(0)
  char    Character @relation(fields:[charId], references:[id])
}
```

---

## 4. API CONTRACT (REST)

> Tất cả response: `{ ok: true, data: T }` hoặc `{ ok: false, error: { code, message } }`.

### 4.1 Auth (`/api/_auth`)
| Method | Path                | Body                                      | Trả về                   |
|--------|---------------------|-------------------------------------------|--------------------------|
| POST   | `/register`         | `{email, password}`                       | `{user}` + set cookie    |
| POST   | `/login`            | `{email, password, rememberEmail?}`       | `{user, character?}`     |
| POST   | `/logout`           | —                                         | `{ok}`                   |
| POST   | `/change-password`  | `{oldPassword, newPassword}`              | `{ok}`                   |
| GET    | `/session`          | (cookie)                                  | `{user, character?}`     |

Mã lỗi:
- `INVALID_CREDENTIALS` → "Danh hiệu hoặc huyền pháp không chính xác."
- `EMAIL_TAKEN` → "Danh hiệu đạo đồ đã được khai lập hoặc dữ liệu không hợp lệ."
- `WEAK_PASSWORD` → "Huyền pháp quá yếu."
- `OLD_PASSWORD_WRONG` → "Huyền pháp cũ không đúng hoặc không tìm thấy tài khoản."

### 4.2 Character
| Method | Path                       | Mô tả                          |
|--------|----------------------------|--------------------------------|
| GET    | `/api/character/me`        | full state                     |
| POST   | `/api/character/onboard`   | tạo tên + chọn môn phái khởi đầu |
| POST   | `/api/character/cultivate/start` | bật cày EXP                |
| POST   | `/api/character/cultivate/stop`  |                              |
| POST   | `/api/character/breakthrough`    | đột phá cảnh giới            |
| POST   | `/api/character/tribulation`     | vào trận thiên kiếp           |
| POST   | `/api/character/settings`        | update settings JSON          |

### 4.3 Inventory & Market
- `GET /api/inventory/me`
- `POST /api/inventory/use { itemId }`
- `POST /api/inventory/equip { itemId, slot }`
- `POST /api/inventory/sell { itemId, qty }`
- `GET /api/inventory/by-name?name=<charName>` *(check-inventory page)*
- `GET /api/market` / `POST /api/market/list` / `POST /api/market/buy/:id`

### 4.4 Boss / Arena
- `GET /api/boss/list?map=<key>`
- `POST /api/boss/:id/attack`
- `GET /api/arena/opponents`
- `POST /api/arena/challenge { opponentId }`
- `GET /api/leaderboard?type=power|arena|sect`

### 4.5 Mail / Topup / Gift
- `GET /api/mail` / `POST /api/mail/:id/claim` / `POST /api/mail/:id/read`
- `POST /api/topup/create { amountVnd }` → trả `txnRef`
- `POST /api/giftcode/redeem { code }` → trả rewards

### 4.6 Admin (role=ADMIN)
- `GET /api/admin/players?q=`
- `POST /api/admin/players/:id/ban` / `unban`
- `POST /api/admin/players/:id/grant { currencyKey, qty }`
- `POST /api/admin/giftcodes`
- `POST /api/admin/mail/broadcast { filter, title, body, rewards }`
- `GET /api/admin/runtime-metrics`
- `POST /api/admin/topup/:id/approve | reject`

---

## 5. API CONTRACT (WEBSOCKET)
- Endpoint: `wss://<host>/ws` (cookie auth).
- Frame: `{ type: string, payload: any, ts: number }`
- Reconnect strategy: exponential backoff 1s → 30s, max 10 lần.
- Heartbeat: client gửi `{type:"ping"}` mỗi 25s; server reply `pong`.
- Server-side rate limit: 30 msg / 10s cho `chat:send`.

Sự kiện server → client: xem **file 02 mục 20.1**.
Lệnh client → server: xem **file 02 mục 20.2**.

---

## 6. RATE LIMIT & ANTI-CHEAT

- **Cultivate tick** xác thực server-side: client chỉ gửi heartbeat `cultivate:tick`,
  EXP do server tính theo (timestamp delta × multiplier). Không tin số từ client.
- **Đột phá**: server kiểm tra `exp >= cost && hasItem('Đột Phá Đan')`.
- **Boss attack**: cooldown 1s/lần/người chơi, lock theo Redis `SET NX PX 1000`.
- **Chat**: Redis token bucket 8 msg/30s.
- **Login**: argon2id, fail-attempts → lock 15 phút sau 5 lần (Redis).
- **JWT**: rotate refresh; revoke all sessions khi đổi mật khẩu.
- **CORS**: chỉ origin chính (web client).
- **CSP**: `default-src 'self'; img-src 'self' https://r2.<host>; connect-src 'self' wss://...`.

---

## 7. ENV / SECRET

```
# apps/api/.env
DATABASE_URL=postgresql://mtt:mtt@localhost:5432/mtt
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
SESSION_COOKIE_DOMAIN=mongtutien.example
S3_ENDPOINT=...
S3_BUCKET=mtt-assets
S3_KEY=...
S3_SECRET=...
SMTP_URL=smtp://...
ADMIN_BOOTSTRAP_EMAIL=admin@example.com

# apps/web/.env
VITE_API_BASE=/api
VITE_WS_URL=wss://api.mongtutien.example/ws
```
