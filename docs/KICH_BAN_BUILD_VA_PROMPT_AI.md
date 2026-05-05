# PHẦN 5 — KỊCH BẢN BUILD (BUILD SCRIPT) & PROMPT GIAO CHO AI CODER

> Mục tiêu: **Đọc xong là chạy được tay**. Phần cuối là các prompt mẫu để dán cho ChatGPT /
> Claude / Devin tự sinh code từng module.

---

## 1. ROADMAP THEO MILESTONE (8 PHASE)

### Phase 0 — Khởi tạo (1 ngày)
1. Tạo monorepo `pnpm` (`apps/web`, `apps/api`, `packages/shared`).
2. Lập `docker-compose.dev.yml`: postgres, redis, minio, mailhog.
3. Khởi tạo Vue 3 + Vite, NestJS, Prisma.
4. CI cơ bản: lint + typecheck.

### Phase 1 — Auth & PWA shell (3 ngày)
1. Trang `/auth` 3 tab (Login/Register/Đổi MK) đúng nội dung file 02.
2. API `/api/_auth/*` với argon2id + JWT.
3. Service worker, manifest, icon, splashscreen.
4. Background tranh thủy mặc + 7 câu thiền random.
5. Toast `gameToast` clone (info/warn/error/success/system, anti-spam 1.2s, max 4 toasts).

**Tiêu chí xong**: Đăng ký → đăng nhập → vào shell rỗng (chỉ topbar) thành công.

### Phase 2 — Game shell + GameHome + State sync (4 ngày)
1. Layout 3 cột (Topbar / Sidebar / ChatDock).
2. Pinia store `game` với toàn bộ field như bundle gốc (state, settings, logs, …).
3. Cấu hình WebSocket gateway server + handler `state:update`, `logs:append`.
4. Cron `cultivation-tick` server-side — cộng EXP mỗi 5s nếu user đang "Nhập Định".
5. UI: hero card, log timeline, 3 nút lớn.
6. Đột phá: API + animation chớp sáng + toast "Đột phá thành công".

**Tiêu chí xong**: Người chơi tạo nhân vật, cày 1 phút, đột phá Luyện Khí Nhị Trọng.

### Phase 3 — Inventory + Map + Boss (5 ngày)
1. Seed `ItemTemplate` 100 mẫu (10 mẫu × 5 phẩm × 2 loại).
2. Trang Inventory với 5 tab, modal chi tiết, equip/use/sell.
3. Trang Check-inventory `/check-inventory` (search-by-name).
4. Trang Online Inspector `/online-inspector` (REST + Redis online list).
5. Map với 6 vùng, BossList theo vùng.
6. Boss: HP shared (mọi người tham gia), cron spawn 30 phút/boss thường,
   3 giờ/boss thế giới, drop bằng % công đóng góp.
7. Marquee "Boss xuất thế tại …" qua WS.

### Phase 4 — Mission, Alchemy, Refinery, Pet, Wife (6 ngày)
1. Mission daily reset 04:00 (BullMQ cron).
2. Alchemy / Refinery: form chọn nguyên liệu, tỉ lệ thành công.
3. Pet gacha 1× / 10×, kết quả lắc thẻ.
4. Wife gacha + WifePanel, route `/wives-with-draft` cho admin duyệt avatar do user up.
5. Tutorial / Onboarding (A Linh).

### Phase 5 — Arena + Chat + Mail (4 ngày)
1. Arena: `/api/arena/opponents` ELO matching, mô phỏng combat lượt server-side.
2. Chat 3 kênh, world có rate-limit 8/30s.
3. Mail (gửi từ admin / tự động khi boss kill) + reward claim.

### Phase 6 — Sự kiện + Topup + Subscription (5 ngày)
1. Khung event scheduler: Halloween, Noel, Quốc Khánh, ThaDen, ĐaiLeThongNhat.
2. WeekendRecharge milestone + claim.
3. Topup VietQR (sinh `MTT-<USER_ID>-<RANDOM6>`) + duyệt thủ công ở admin.
4. Subscription gói tháng (web payment test).

### Phase 7 — Admin + Anti-cheat + Tối ưu (4 ngày)
1. Tất cả trang `/admin/*`.
2. Audit log mọi thao tác admin.
3. Sentry / Pino + dashboard `/admin/runtime-metrics`.
4. PWA cache strategy (Workbox `staleWhileRevalidate` cho asset, `networkFirst` cho API).

### Phase 8 — QA, balance, ra mắt (∞)
- Bảng cân bằng EXP / damage / drop-rate (Google Sheet).
- Closed beta 50 người, log bug.
- Ra mắt.

---

## 2. CHECKLIST DỮ LIỆU CẦN SEED

- [ ] `realms.json` — 28 cảnh giới × 9 trọng (file 03 mục 1).
- [ ] `titles.json` — 60+ xưng hiệu mốc.
- [ ] `proverbs.json` — 7 câu thiền (file 02 mục 1.3).
- [ ] `skills.json` — 50 skill (sample ở file 03 mục 4).
- [ ] `items.seed.json` — 100 mẫu vật phẩm.
- [ ] `bosses.seed.json` — 30 boss (Huyết Ma Chúa, Thiên Ma…).
- [ ] `maps.seed.json` — 6+ vùng (Tu Tiên Sâm Lâm → Hồng Mông Cấm Địa).
- [ ] `events.config.json` — lịch sự kiện theo tháng.
- [ ] `i18n/vi.json` — toàn bộ chuỗi UI tiếng Việt (xem file 02).

---

## 3. LỆNH KHỞI TẠO REPO (COPY-PASTE)

```bash
# 0. Tạo workspace
mkdir mongtutien-clone && cd $_
git init -b main
pnpm init
cat > pnpm-workspace.yaml <<EOF
packages:
  - apps/*
  - packages/*
EOF

# 1. Frontend
mkdir -p apps/web && cd apps/web
pnpm create vite@latest . -- --template vue-ts
pnpm add pinia vue-router@4 axios @vueuse/core zod vee-validate
pnpm add socket.io-client workbox-window
pnpm add -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
cd ../..

# 2. Backend
mkdir -p apps/api && cd apps/api
pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
pnpm add @prisma/client argon2 bullmq ioredis pino zod
pnpm add -D prisma
npx prisma init
cd ../..

# 3. Shared
mkdir -p packages/shared/src && cd packages/shared
pnpm init
pnpm add zod
cd ../..

# 4. Infra
mkdir infra && cat > infra/docker-compose.dev.yml <<'EOF'
version: "3.9"
services:
  pg:    { image: postgres:16, environment: { POSTGRES_PASSWORD: mtt, POSTGRES_USER: mtt, POSTGRES_DB: mtt }, ports: ["5432:5432"], volumes: [pgdata:/var/lib/postgresql/data] }
  redis: { image: redis:7, ports: ["6379:6379"] }
  minio: { image: quay.io/minio/minio, command: "server /data --console-address :9001", environment: { MINIO_ROOT_USER: admin, MINIO_ROOT_PASSWORD: admin12345 }, ports: ["9000:9000","9001:9001"], volumes: [minio:/data] }
  mailhog: { image: mailhog/mailhog, ports: ["1025:1025","8025:8025"] }
volumes:
  pgdata: {}
  minio:  {}
EOF

# 5. Khởi động dev
docker compose -f infra/docker-compose.dev.yml up -d
```

---

## 4. PROMPT MẪU GỬI CHO AI CODER

> Dán nguyên các prompt sau lên ChatGPT/Claude/Cursor/Devin để sinh code từng module.

### 4.1 Prompt — Trang `/auth`
```
Bạn là Vue 3 + TypeScript expert. Tạo cho tôi component AuthView.vue (route /auth) với 3 tab:
"Đăng Nhập", "Đăng Ký", "Đổi Mật Khẩu", phong cách CỔ PHONG THỦY MẶC theo design tokens
sau (paste tokens từ file 01 §4.2).
Yêu cầu CHÍNH XÁC nội dung text như sau (giữ nguyên):
- Tiêu đề chung: "Đạo Môn"
- Câu thiền random từ 7 câu (paste 7 câu từ file 02 §1.3)
- Tab Đăng Nhập: label "Tài Khoản (Email)", "Huyền Pháp Bảo Hộ (Mật Khẩu)",
  checkbox "Ghi nhớ email", note phải "Mật khẩu sẽ được bảo vệ theo phiên.",
  nút submit "Nhập Định Tu Hành" (loading state "Đang xử lý…").
- Tab Đăng Ký: nút "Khai Tông Lập Danh", có thanh độ mạnh mật khẩu với 5 mức
  ["Yếu","Trung bình","Khá","Mạnh","Rất mạnh"], prefix "Độ mạnh:".
- Tab Đổi Mật Khẩu: "Huyền Pháp Cũ", "Huyền Pháp Mới", nút "Đổi pháp".
Sử dụng vee-validate + zod. Gọi API /api/_auth/login|register|change-password.
Toast lỗi server theo mã: INVALID_CREDENTIALS → "Danh hiệu hoặc huyền pháp không chính xác."
EMAIL_TAKEN → "Danh hiệu đạo đồ đã được khai lập hoặc dữ liệu không hợp lệ."
OLD_PASSWORD_WRONG → "Huyền pháp cũ không đúng hoặc không tìm thấy tài khoản."
Toast thành công đăng ký: "Khai tông lập danh thành công. Mời đạo hữu nhập định tu hành."
```

### 4.2 Prompt — Pinia store `game`
```
Tạo Pinia store `useGameStore` (TS, defineStore) với state đầy đủ các field sau (giữ nguyên tên):
giftLog, activeTutorialStep, gameViewClass, logs, enemy, state, dialogue, buttonLocked,
combatPending, dialogueChoices, shouldBossBossNotify, onlineCount, leaderboard,
arena{opponents,myRank}, bossState, bossEnd, settings (xem file 03 §6), towerLogs,
towerRanking, chat, onlinePlayers, petRollResults, pets, wifeRollResults, wives, sect,
loading, wifeBackgroundOpacity, wifeBackground, backgroundDefault, notifications,
bossList, realmBossList, playerInspect, playerInspectLoading, pvpResult, equipmentPopup,
isPlayerPreview, mineList, mineLogs, sectList, mapUpdate, outerRealmPlayers,
outerRealmMonsters, outerRealmCombatInfo, sanctumList, systemMessages, artifactRollResult,
artifacts, topup, personalBossList, personalPetBossList, personalWifeBossList,
personalBossProgress, sectBoss, spamWarning, towerInfo, market, changeEncounterEvent,
sectWarReward, subscriptions, claimedSubscriptions, dungeonState, dungeonRewards.

Action: pushMarquee, bossReset, addNotification, setLoading, setCombatPending,
clearCombatPending, setRollPet, clearRollPet, setRollWife, clearRollWife, setBossState,
addLogs (cap 50), addTowerLogs (cap 80), setTowerLogs, clearTowerLogs, setLogs,
setEnemy, clearEnemy, updateState (merge từng key), resetSessionState ($reset),
fetchCharacter (gọi GET /api/character/me).

Getter: getPlayerSectInfo, getMapState, getState.

addLogs: nếu logs.length>50 thì splice(0, length-50). Tương tự towerLogs cap 80.
```

### 4.3 Prompt — Toast store
```
Tạo Pinia store `useToastStore` mô phỏng gameToast của Mộng Tu Tiên:
- state: toasts: Toast[].
- action push(input: string|{type, text, title?, duration?}):
  + map type: warn|warning→"warning", error→"error", success|system→"success", default→"info".
  + duration mặc định: warn/error 3600ms, còn lại 2600ms.
  + title map: info "Tin tức", warning "Cảnh báo", error "Lỗi", success "Thành công",
    system "Thiên Đạo Sứ Giả".
  + chống spam: cùng (type+text) trong 1200ms thì bỏ qua.
  + giữ tối đa 4 toast (slice(-4)).
- action remove(id), clear().
Component MToast.vue render với CSS cổ phong (border vàng, blur 8px nền).
```

### 4.4 Prompt — Map cảnh giới
```
Tạo file packages/shared/src/realms.ts export const REALMS = [...]
gồm 28 đại cảnh giới (xem danh sách trong tài liệu file 03 §1.2-1.6).
Mỗi entry: { key: string (snake_case), name: string, stages: 1..9 hoặc 1, expCost: bigint,
order: number, tier: "phàm"|"nhân tiên"|"tiên giới"|"hỗn nguyên"|"bản nguyên"|"vĩnh hằng" }.
Sinh tên đầy đủ: `${name} ${roman(i)} Trọng` với roman = ["Nhất","Nhị","Tam","Tứ","Ngũ",
"Lục","Thất","Bát","Cửu"].
ExpCost tăng theo công thức: base = 1e3 * 1.6^order ; mỗi trọng × 1.4.
```

### 4.5 Prompt — Component MProgressLeaf
```
Tạo Vue component <MProgressLeaf :percent="0..100" /> hiển thị thanh tiến độ
hình lá tre / khí mây — gồm n đốt, mỗi đốt là 1 lá svg dồn từ trái sang phải,
biến CSS: --m-progress-leaf-height, --m-progress-per-height, --m-progress-per-width,
--m-progress-width, --m-progress-height. Khi đầy 100% có hiệu ứng glow vàng và
animation Wave (0→10°→15°→0→-10°→-15°→0).
```

### 4.6 Prompt — WebSocket client
```
Tạo apps/web/src/ws/socket.ts: lớp GameSocket
- connect(): wss://${import.meta.env.VITE_WS_URL}, withCredentials true.
- reconnect: exponential backoff 1s → 30s, max 10 lần. Trong khi reconnect,
  push toast type="warning" "Mất kết nối, đang nối lại…" (max 1 lần / 30s).
- heartbeat: ping mỗi 25s, expect pong trong 8s, nếu không thì close+reconnect.
- emit(type, payload): gửi { type, payload, ts: Date.now() }.
- on(type, handler): subscribe.
- Tự dispatch vào các store: state:update→game.updateState; logs:append→game.addLogs;
  marquee→game.pushMarquee; chat:msg→chat.add; boss:spawn→game.setBossState +
  toast.push({type:"warning", text:"Boss xuất thế!"}); mail:new→toast.push({type:"system",
  text:"Bạn có thư mới từ Thiên Đạo Sứ Giả!"}).
```

### 4.7 Prompt — Backend Auth (NestJS)
```
Tạo module @nestjs/auth: register, login, refresh, change-password, session.
- argon2id (memoryCost 64MB, timeCost 3, parallelism 1).
- access JWT 15 phút (HS256), refresh JWT 30 ngày, both stored in httpOnly secure cookie.
- Mỗi user có salt riêng + version refresh; đổi mật khẩu → tăng version để revoke all.
- Rate limit login: 5 fail / 15p / IP+email.
- Validate input zod: email() và password min 8, có chữ + số.
- Các mã lỗi trả về (i18n key): INVALID_CREDENTIALS, EMAIL_TAKEN, WEAK_PASSWORD,
  OLD_PASSWORD_WRONG.
```

### 4.8 Prompt — Cron tu luyện
```
Tạo BullMQ worker `cultivation-tick` chạy mỗi 5 giây:
- query characters đang state.cultivating = true.
- mỗi char: cộng EXP = baseRate (depends realm) × multiplier (item buff, sect buff, event).
- nếu vượt mốc trọng → log "Linh khí dồi dào, EXP +X" mọi 5 dòng → 1 dòng cho UI.
- nếu đủ ngưỡng đột phá → set flag canBreakthrough.
- Phát WS event state:update với delta keys.
- Throttle: gom log 10 dòng/char rồi mới gửi.
```

### 4.9 Prompt — Trang Topup
```
Tạo TopupView (/topup) có 2 nút:
- "Mở Admin Topup" (chỉ hiển thị khi role=ADMIN)
- "Về trang chủ"
Banner trên đầu: "Công Cụ Nạp Thủ Công Đã Chuyển Vào Admin".
Bên dưới: form sinh mã chuyển khoản dạng "MTT-<USER_ID>-<RANDOM6>",
hiển thị QR VietQR (dùng vietqr.io image API) với amount user nhập (50k/100k/200k/500k).
Backend POST /api/topup/create lưu txnRef, status=PENDING.
Khi admin duyệt → cộng tienNgoc và gửi mail "Cảm tạ đạo hữu, Tiên Ngọc đã đến."
```

### 4.10 Prompt — Trang Admin
```
Tạo AdminLayout có sidebar 6 mục:
- Dashboard, GiftCodes, Mail, Players, Equipment Identity, Runtime Metrics, Topup.
Dashboard: 4 KPI card (Online, DAU, Boss kill 24h, Doanh thu 24h) + chart 7 ngày.
GiftCodes: form tạo (code, usesLeft, expiresAt, rewards JSON), table list.
Mail: rich text, target filter (toàn server / cảnh giới ≥ X / sect=Y), preview, gửi.
Players: search, ban/unban, set realm, grant currency (audit log).
Equipment Identity: chọn item template, sửa baseStats JSON.
Runtime Metrics: WS connections, CPU, RAM, request/s — từ /api/admin/runtime-metrics.
Topup: list giao dịch PENDING, nút Approve / Reject (kèm note).
Tất cả đều require role=ADMIN, dùng router guard.
```

---

## 5. KIỂM THỬ (TEST PLAN TỐI THIỂU)

| Loại         | Ví dụ                                                              |
|--------------|--------------------------------------------------------------------|
| Unit (FE)    | toast anti-spam, breakthrough button enable, exp formatter         |
| Unit (BE)    | argon2 verify, jwt rotation, breakthrough cost validation          |
| Integration  | login → cookie set → /character/me OK                              |
| WS           | reconnect khi server restart, heartbeat timeout                    |
| E2E (Playwright) | đăng ký → onboarding → cày 30s → đột phá → mở inventory       |
| Load         | 1000 socket đồng thời + 500 RPS REST (k6/Artillery)                |

---

## 6. CÁCH ĐO "ĐÚNG GIỐNG TRANG GỐC"

Với mỗi page / panel, có thể chấm theo 5 tiêu chí (mỗi cái 0–10đ):
1. Bố cục (layout) khớp.
2. Bảng màu / typography khớp.
3. Nội dung text (literal) khớp 1:1.
4. Tương tác (toast, modal, animation) khớp.
5. State đồng bộ qua WebSocket khớp.

Đạt ≥ 40/50 = "giống đến mức người chơi không phân biệt được".

---

## 7. PHÁP LÝ — LƯU Ý

- **Tên dự án**: KHÔNG dùng nguyên "Mộng Tu Tiên" cho bản clone công khai. Đổi tên,
  logo, favicon. Có thể giữ tagline "Trải nghiệm tu tiên MUD - Cổ phong" (chung chung).
- **Asset**: KHÔNG copy ảnh background / favicon / art đạo lữ từ trang gốc. Tự sinh
  bằng Stable Diffusion / Midjourney với prompt "Chinese ink wash mountains, misty,
  cultivation novel cover art".
- **Văn bản**: copy chính xác ÔK với chuỗi UI thuần kỹ thuật ("Đăng Nhập", "Túi đồ"),
  nhưng phần thoại A Linh / câu thiền thì viết lại để tránh tranh chấp.
- **Code**: bundle gốc bị minify — không reverse logic của họ. Các API/WS/DB ở đây là
  bản tái dựng độc lập, không chép từ source.
