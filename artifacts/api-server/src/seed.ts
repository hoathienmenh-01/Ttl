import { db } from "@workspace/db";
import {
  itemTemplatesTable, bossTemplatesTable, missionTemplatesTable, sectsTable, usersTable,
  npcsTable, skillTemplatesTable, dungeonTemplatesTable,
  achievementTemplatesTable, alchemyRecipesTable, battlePassSeasonsTable,
} from "@workspace/db";
import type { BattlePassTier } from "@workspace/db";
import { eq } from "drizzle-orm";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.SESSION_SECRET ?? "salt"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

async function seed() {
  console.log("Seeding Hoa Thien Mon database...");

  // ── Item Templates ──────────────────────────────────────────────────────────
  await db.insert(itemTemplatesTable).values([
    { id: "linh_thao",       name: "Linh Thảo",            quality: "pham",  type: "herb",      baseStats: { hp: 50, mp: 30 },  sellPrice: 20,   description: "Loại cỏ linh khí mọc nơi núi cao, dùng để chế đan.",     stackable: true  },
    { id: "hoi_khi_dan",     name: "Hồi Khí Đan",          quality: "pham",  type: "pill",      baseStats: { hp: 150 },          sellPrice: 60,   description: "Đan dược hồi phục 150 HP cơ bản.",                         stackable: true  },
    { id: "truc_co_dan",     name: "Trúc Cơ Đan",          quality: "linh",  type: "pill",      baseStats: { exp: 1000 },        sellPrice: 500,  description: "Đan dược quý giúp tăng tốc Trúc Cơ, cộng 1000 EXP.",     stackable: true  },
    { id: "pham_kiem",       name: "Phàm Kiếm",            quality: "pham",  type: "weapon",    baseStats: { atk: 20 },          sellPrice: 100,  description: "Thanh kiếm phàm tục, rèn từ sắt thường.",                 stackable: false },
    { id: "moc_linh_phu",    name: "Mộc Linh Phù",         quality: "linh",  type: "misc",      baseStats: { def: 15, mp: 50 },  sellPrice: 200,  description: "Linh phù hệ Mộc, tăng phòng thủ và linh lực.",           stackable: true  },
    { id: "kim_quang_dan",   name: "Kim Quang Đan",        quality: "linh",  type: "pill",      baseStats: { atk: 30 },          sellPrice: 400,  description: "Đan tăng công kích Kim hệ trong 1 trận.",                  stackable: true  },
    { id: "thuy_linh_thu",   name: "Thủy Linh Thủy",       quality: "linh",  type: "pill",      baseStats: { hp: 500, mp: 200 }, sellPrice: 350,  description: "Nước linh thiêng hệ Thủy, hồi HP và MP.",                stackable: true  },
    { id: "hoa_tinh_thach",  name: "Hỏa Tinh Thạch",      quality: "huyen", type: "ore",       baseStats: {},                   sellPrice: 600,  description: "Đá tinh linh hệ Hỏa, vật liệu rèn vũ khí Hỏa.",         stackable: true  },
    { id: "tho_cot_thu",     name: "Thổ Cốt Thú",          quality: "pham",  type: "misc",      baseStats: {},                   sellPrice: 40,   description: "Xương thú Thổ hệ, vật liệu luyện giáp.",                  stackable: true  },
    { id: "linh_chi",        name: "Linh Chi Hoang",       quality: "pham",  type: "herb",      baseStats: { hp: 50, mp: 50 },   sellPrice: 30,   description: "Thảo dược linh khí nhẹ, dùng chế đan hạng thấp.",        stackable: true  },
    { id: "truc_diep",       name: "Trúc Diệp Thanh",      quality: "linh",  type: "herb",      baseStats: { mp: 200 },          sellPrice: 150,  description: "Lá trúc hấp thu tinh khí đêm, hồi MP.",                  stackable: true  },
    { id: "thiet_tinh",      name: "Thiết Tinh Quặng",     quality: "pham",  type: "ore",       baseStats: {},                   sellPrice: 20,   description: "Quặng sắt tinh chất, vật liệu rèn đúc.",                  stackable: true  },
    { id: "ngoc_than",       name: "Ngọc Thần Thạch",      quality: "huyen", type: "ore",       baseStats: {},                   sellPrice: 500,  description: "Đá thần hiếm chứa linh lực mạnh.",                        stackable: true  },
    { id: "kiem_pham",       name: "Kiếm Phàm Trần",       quality: "pham",  type: "weapon",    baseStats: { atk: 25 },          sellPrice: 120,  description: "Kiếm phàm cơ bản.",                                        stackable: false },
    { id: "kiem_linh",       name: "Linh Kiếm Phong Nhuệ", quality: "linh",  type: "weapon",    baseStats: { atk: 90 },          sellPrice: 600,  description: "Kiếm hàm chứa linh khí, sắc bén.",                        stackable: false },
    { id: "giap_linh_thu",   name: "Giáp Linh Thú",        quality: "linh",  type: "armor",     baseStats: { def: 60 },          sellPrice: 450,  description: "Giáp da linh thú, tăng phòng thủ.",                       stackable: false },
    { id: "ngoc_boi_linh",   name: "Ngọc Bội Linh Lực",   quality: "linh",  type: "accessory", baseStats: { spirit: 30 },       sellPrice: 600,  description: "Ngọc bội hấp thu linh lực tự nhiên.",                     stackable: false },
    { id: "hoa_thien_ling",  name: "Hoa Thiên Linh Ngọc", quality: "huyen", type: "accessory", baseStats: { spirit: 80, atk: 30 }, sellPrice: 3000, description: "Ngọc linh bảo của Hoa Thiên Môn, tăng mạnh linh cảm.",  stackable: false },
    { id: "khai_tam_dan",    name: "Khai Tâm Đan",         quality: "linh",  type: "pill",      baseStats: { exp: 500 },         sellPrice: 300,  description: "Khai sáng tâm trí, +500 EXP.",                             stackable: true  },
    // Hat slot items
    { id: "pham_cu",         name: "Phàm Cự Đạo Khăn",    quality: "pham",  type: "hat",       baseStats: { spirit: 10 },       sellPrice: 80,   description: "Khăn đạo phàm tục, giúp tập trung linh lực.",              stackable: false },
    { id: "linh_quan",       name: "Linh Quán Tinh Khí",   quality: "linh",  type: "hat",       baseStats: { spirit: 45, mp: 80 }, sellPrice: 500, description: "Đạo quán hàm chứa tinh khí, tăng mạnh thần thức.",         stackable: false },
    { id: "huyen_mo",        name: "Huyền Mô Thái Cực",    quality: "huyen", type: "hat",       baseStats: { spirit: 100, mp: 200, speed: 10 }, sellPrice: 2500, description: "Mũ pháp bảo cấp Huyền, chứa đựng năng lượng Thái Cực.", stackable: false },
    // Belt slot items
    { id: "pham_dai",        name: "Phàm Đai Da Thú",      quality: "pham",  type: "belt",      baseStats: { def: 8, hp: 30 },   sellPrice: 70,   description: "Đai da thú rèn từ vật liệu phàm, tăng chút phòng thủ.",    stackable: false },
    { id: "linh_dai",        name: "Linh Đai Bạch Ngọc",   quality: "linh",  type: "belt",      baseStats: { def: 35, hp: 120 }, sellPrice: 420,  description: "Đai bạch ngọc chứa linh lực, gia tăng sinh lực và phòng thủ.", stackable: false },
    { id: "kim_luon_dai",    name: "Kim Luân Đai",          quality: "huyen", type: "belt",      baseStats: { def: 80, hp: 300, atk: 15 }, sellPrice: 2000, description: "Đai Kim Luân cấp Huyền, vừa tăng phòng thủ vừa hỗ trợ tấn công.", stackable: false },
    // Boots slot items
    { id: "pham_hia",        name: "Phàm Hia Vải",         quality: "pham",  type: "boots",     baseStats: { speed: 8 },         sellPrice: 60,   description: "Đôi hia vải thường, giúp bước đi linh hoạt hơn.",           stackable: false },
    { id: "linh_hia",        name: "Linh Hia Tốc Phong",   quality: "linh",  type: "boots",     baseStats: { speed: 35, luck: 10 }, sellPrice: 380, description: "Hia chứa tốc phong linh khí, tăng tốc độ di chuyển.",     stackable: false },
    { id: "van_bu_hia",      name: "Vân Bộ Phi Hia",       quality: "huyen", type: "boots",     baseStats: { speed: 80, luck: 25, def: 20 }, sellPrice: 1800, description: "Hia pháp bảo cho phép người mang bước trên mây.", stackable: false },
    // More accessories
    { id: "thiet_nhan_van",  name: "Thiết Nhẫn Vân Tinh",  quality: "pham",  type: "accessory", baseStats: { atk: 12, luck: 5 }, sellPrice: 150,  description: "Chiếc nhẫn sắt chứa vân tinh, tăng tấn công và may mắn.",   stackable: false },
    { id: "huyen_ngoc_boi",  name: "Huyền Ngọc Bội Thần",  quality: "huyen", type: "accessory", baseStats: { spirit: 120, atk: 50, speed: 20 }, sellPrice: 5000, description: "Ngọc bội pháp bảo cấp Huyền, tổng hợp nhiều thuộc tính.", stackable: false },
    // Healing pill
    { id: "da_hoi_dan",      name: "Đại Hồi Đan",          quality: "linh",  type: "pill",      baseStats: { hp: 800, mp: 300 }, sellPrice: 600,  description: "Đan dược mạnh, hồi phục lượng lớn HP và MP.",              stackable: true  },
  ]).onConflictDoNothing();

  // ── Skill Templates ─────────────────────────────────────────────────────────
  await db.insert(skillTemplatesTable).values([
    { id: "kim_quang_tram",    name: "Kim Quang Trảm",     element: "kim",  type: "attack",  description: "Pháp thuật Kim hệ. Dùng kim quang chém địch, sát thương cao.",    mpCost: 20, cooldownSeconds: 3,  damageMultiplier: 1.5, realmRequired: "phamnhan" },
    { id: "thanh_moc_hoi_xuan",name: "Thanh Mộc Hồi Xuân", element: "moc",  type: "heal",   description: "Pháp thuật Mộc hệ. Dùng linh khí xanh mướt hồi phục thương thế.", mpCost: 25, cooldownSeconds: 5,  healMultiplier: 1.5,   realmRequired: "phamnhan" },
    { id: "thuy_tien",         name: "Thủy Tiên",           element: "thuy", type: "attack",  description: "Pháp thuật Thủy hệ. Lưỡi thủy đao vô hình tấn công liên hoàn.",   mpCost: 18, cooldownSeconds: 3,  damageMultiplier: 1.3, realmRequired: "phamnhan" },
    { id: "hoa_cau",           name: "Hỏa Cầu",             element: "hoa",  type: "attack",  description: "Pháp thuật Hỏa hệ. Tung cầu lửa thiêu đốt kẻ địch.",              mpCost: 22, cooldownSeconds: 4,  damageMultiplier: 1.4, realmRequired: "phamnhan" },
    { id: "tho_thuan",         name: "Thổ Thuẫn",           element: "tho",  type: "defense", description: "Pháp thuật Thổ hệ. Khiên đất vững chắc, tăng phòng thủ.",          mpCost: 15, cooldownSeconds: 6,  damageMultiplier: 0.8, realmRequired: "phamnhan" },
    { id: "loi_bat",           name: "Lôi Bạt",             element: "loi",  type: "attack",  description: "Lôi hệ cấp trung. Sét đánh uy lực, gây sát thương diện rộng.",     mpCost: 35, cooldownSeconds: 6,  damageMultiplier: 1.8, realmRequired: "luyenkhi" },
    { id: "bang_phong",        name: "Băng Phong",           element: "bang", type: "attack",  description: "Băng hệ cấp trung. Phong ấn kẻ địch bằng lớp băng lạnh giá.",      mpCost: 30, cooldownSeconds: 5,  damageMultiplier: 1.6, realmRequired: "luyenkhi" },
  ]).onConflictDoNothing();

  // ── Dungeon Templates ───────────────────────────────────────────────────────
  await db.insert(dungeonTemplatesTable).values([
    { id: "thanh_khe_coc",    name: "Thanh Khê Cốc",      description: "Thung lũng suối xanh nơi dã thú nguy hiểm ẩn náu. Bí cảnh đầu tiên của đệ tử Hoa Thiên Môn.", element: "moc",  minRealm: "phamnhan", difficulty: "easy",   stages: 3, monsterName: "Thanh Lang Yêu",  monsterHp: 300,  monsterAtk: 40,  monsterDef: 8,  expReward: 300,   linhThachReward: 150,  dropItems: ["linh_chi", "hoi_khi_dan"] },
    { id: "co_quang_mo",      name: "Cổ Quặng Mỏ",        description: "Mỏ quặng cổ đại bị Thổ quái chiếm giữ. Tài nguyên quý hiếm chờ người dũng cảm.",             element: "tho",  minRealm: "phamnhan", difficulty: "easy",   stages: 3, monsterName: "Thổ Quái Nhỏ",   monsterHp: 450,  monsterAtk: 55,  monsterDef: 20, expReward: 400,   linhThachReward: 200,  dropItems: ["thiet_tinh", "tho_cot_thu"] },
    { id: "hoa_nguyen_quan",  name: "Hỏa Nguyên Quan",    description: "Quan ải cháy bỏng nơi Hỏa linh thú làm chủ. Nguy hiểm bậc trung.",                            element: "hoa",  minRealm: "luyenkhi", difficulty: "medium", stages: 4, monsterName: "Hỏa Hồ Linh",    monsterHp: 800,  monsterAtk: 100, monsterDef: 30, expReward: 1000,  linhThachReward: 500,  dropItems: ["hoa_tinh_thach", "kim_quang_dan"] },
    { id: "tuyet_son_dong",   name: "Tuyết Sơn Động",     description: "Hang tuyết trên đỉnh núi cao, Băng hệ linh thú canh gác kho báu cổ.",                         element: "bang", minRealm: "luyenkhi", difficulty: "medium", stages: 4, monsterName: "Băng Lang Yêu",   monsterHp: 1000, monsterAtk: 120, monsterDef: 40, expReward: 1200,  linhThachReward: 600,  dropItems: ["thuy_linh_thu", "ngoc_boi_linh"] },
    { id: "loi_nguyen_dinh",  name: "Lôi Nguyên Đỉnh",   description: "Đỉnh núi nơi sấm sét không ngừng, nơi Lôi hệ cường giả ẩn tu.",                               element: "loi",  minRealm: "trucco",   difficulty: "hard",   stages: 5, monsterName: "Lôi Ưng Thần",   monsterHp: 3000, monsterAtk: 300, monsterDef: 80, expReward: 5000,  linhThachReward: 2500, dropItems: ["ngoc_than", "hoa_thien_ling"] },
    { id: "am_linh_den",      name: "Âm Linh Điện",       description: "Điện thờ cổ của Tịch Thiên Điện bị bỏ hoang. Nơi đây chứa bí mật về đại kiếp thượng cổ.",     element: "am",   minRealm: "trucco",   difficulty: "hard",   stages: 5, monsterName: "Tịch Thiên Hộ Vệ", monsterHp: 4000, monsterAtk: 400, monsterDef: 100, expReward: 8000, linhThachReward: 4000, dropItems: ["hoa_thien_ling", "truc_co_dan"] },
  ]).onConflictDoNothing();

  // ── Boss Templates ──────────────────────────────────────────────────────────
  await db.insert(bossTemplatesTable).values([
    { id: "wolf_king",     name: "Sói Ma Vương",          description: "Sói hung tàn nơi Thanh Khê Cốc, mắt đỏ như máu — mối đe dọa đầu tiên của ngoại môn đệ tử.",   element: "moc",  hpMax: 5000,   power: 100,   atk: 80,   def: 20,  minRealm: "phamnhan", zone: "thanh_khe",      isWorldBoss: false, expDrop: 200,   linhThachDrop: 100,   dropItems: ["hoi_khi_dan", "linh_chi"],       spawnIntervalMinutes: 30  },
    { id: "stone_golem",   name: "Thổ Quái Thạch Khổng Lồ", description: "Thạch nhân khổng lồ thủ hộ mỏ quặng cổ đại.",                                               element: "tho",  hpMax: 15000,  power: 300,   atk: 150,  def: 80,  minRealm: "luyenkhi", zone: "co_quang_mo",    isWorldBoss: false, expDrop: 600,   linhThachDrop: 300,   dropItems: ["thiet_tinh"],                    spawnIntervalMinutes: 60  },
    { id: "fire_serpent",  name: "Hỏa Mãng Xà Thần",     description: "Mãng xà linh thú nắm giữ Hỏa Nguyên Châu, thân mình phun lửa ngàn độ.",                       element: "hoa",  hpMax: 40000,  power: 800,   atk: 400,  def: 150, minRealm: "trucco",   zone: "hoa_nguyen_quan", isWorldBoss: false, expDrop: 2000,  linhThachDrop: 1000,  dropItems: ["hoa_tinh_thach", "khai_tam_dan"], spawnIntervalMinutes: 120 },
    { id: "tich_thien",    name: "Tịch Thiên Hộ Pháp",   description: "Cường giả Tịch Thiên Điện, kẻ thực thi lệnh khóa đường tu tiên của chúng sinh.",               element: "am",   hpMax: 120000, power: 3000,  atk: 1200, def: 500, minRealm: "kimdan",   zone: "am_linh_den",    isWorldBoss: false, expDrop: 12000, linhThachDrop: 6000,  dropItems: ["hoa_thien_ling"],                spawnIntervalMinutes: 360 },
    { id: "loi_long",      name: "Lôi Long Cổ Thần",     description: "Long thần Lôi Nguyên cổ đại từ Thượng Cổ, sấm sét hào quang bao phủ.",                        element: "loi",  hpMax: 500000, power: 15000, atk: 5000, def: 2000, minRealm: "nguyenanh", zone: "loi_nguyen_dinh", isWorldBoss: true, expDrop: 80000, linhThachDrop: 40000, dropItems: ["hoa_thien_ling", "ngoc_than"],   spawnIntervalMinutes: 720 },
  ]).onConflictDoNothing();

  // ── Mission Templates ───────────────────────────────────────────────────────
  await db.insert(missionTemplatesTable).values([
    // Main quests — Phàm Nhân
    { id: "phamnhan_main_01", code: "M001", name: "Ngoại Môn Nhập Đạo",       description: "Chưởng Môn Lăng Vân Sinh đã thu nhận ngươi làm ngoại môn đệ tử Hoa Thiên Môn. Hãy tạo nhân vật và bước lên con đường tu tiên.",              type: "main",  npcName: "Lăng Vân Sinh",     realmRequired: null,       progressMax: 1, objectiveType: null,          rewardExp: 200,  rewardLinhThach: 500,  rewardItems: ["hoi_khi_dan"],   order: 1 },
    { id: "phamnhan_main_02", code: "M002", name: "Nhập Định Lần Đầu",         description: "Đại sư tỷ Mộc Thanh Y hướng dẫn ngươi phương pháp nhập định cơ bản. Hãy bắt đầu tu luyện và thu thập linh khí.",                             type: "main",  npcName: "Mộc Thanh Y",       realmRequired: null,       progressMax: 1, objectiveType: "cultivate",   rewardExp: 400,  rewardLinhThach: 300,  rewardItems: ["moc_linh_phu"],  order: 2 },
    { id: "phamnhan_main_03", code: "M003", name: "Thử Thách Sói Ma",          description: "Hàn Dạ thách ngươi dám vào Thanh Khê Cốc để chứng minh thực lực. Tiêu diệt Sói Ma Vương để lấy lại thể diện!",                              type: "main",  npcName: "Hàn Dạ",           realmRequired: null,       progressMax: 1, objectiveType: "boss_kill",   rewardExp: 600,  rewardLinhThach: 1000, rewardItems: ["pham_kiem"],     order: 3 },
    { id: "phamnhan_main_04", code: "M004", name: "Bí Mật Linh Mạch",         description: "Tô Nguyệt Ly nói với ngươi rằng linh mạch Hoa Thiên Môn đang bị Tịch Thiên Điện phong ấn. Điều tra Thanh Khê Cốc để tìm manh mối.",         type: "main",  npcName: "Tô Nguyệt Ly",     realmRequired: null,       progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 800, rewardLinhThach: 800,  rewardItems: ["linh_chi"],      order: 4 },
    // Main quests — Luyện Khí
    { id: "luyenkhi_main_01", code: "M005", name: "Luyện Khí Khai Môn",        description: "Đột phá lên Luyện Khí, bước đầu tiên trên con đường tu tiên chân chính. Lăng Vân Sinh ban thưởng cho người đầu tiên đột phá.",              type: "realm", npcName: "Lăng Vân Sinh",     realmRequired: "phamnhan", progressMax: 1, objectiveType: "breakthrough", rewardExp: 1000, rewardLinhThach: 2000, rewardItems: ["khai_tam_dan"],  order: 5 },
    { id: "luyenkhi_main_02", code: "M006", name: "Thu Thập Linh Thảo",        description: "Mộc Thanh Y cần Linh Thảo để bào chế đan dược chữa thương cho tông môn. Thu thập 5 cây Linh Thảo tại vùng núi.",                          type: "npc",   npcName: "Mộc Thanh Y",       realmRequired: "phamnhan", progressMax: 5, objectiveType: null,          rewardExp: 500,  rewardLinhThach: 600,  rewardItems: ["truc_co_dan"],   order: 6 },
    { id: "luyenkhi_main_03", code: "M007", name: "Đấu Pháp Với Hàn Dạ",     description: "Hàn Dạ muốn đọ sức cùng ngươi tại võ đài tông môn để xem ai tiến bộ nhanh hơn. Chinh phục Cổ Quặng Mỏ để chứng minh.",                    type: "main",  npcName: "Hàn Dạ",           realmRequired: "luyenkhi", progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 1500, rewardLinhThach: 1500, rewardItems: ["kim_quang_dan"], order: 7 },
    // Main quests — Trúc Cơ
    { id: "truc_co_main_01",  code: "M008", name: "Trúc Cơ Đại Thành",        description: "Lăng Vân Sinh nói đây là bước quan trọng nhất — từ phàm nhân bước vào cảnh giới tu tiên thực sự. Hãy đột phá lên Trúc Cơ.",              type: "realm", npcName: "Lăng Vân Sinh",     realmRequired: "luyenkhi", progressMax: 1, objectiveType: "breakthrough", rewardExp: 5000, rewardLinhThach: 5000, rewardItems: ["hoa_thien_ling", "truc_co_dan"], order: 8 },
    // Main quests — Kim Đan
    { id: "kimdan_main_01",   code: "M009", name: "Kim Đan Khai Lô",           description: "Lăng Vân Sinh nói: Kim Đan là cảnh giới mà chỉ một trong vạn tu sĩ đạt được. Đây là sự chuyển hóa thực sự từ thể xác sang linh hồn. Hãy đột phá!", type: "realm", npcName: "Lăng Vân Sinh", realmRequired: "trucco",  progressMax: 1, objectiveType: "breakthrough", rewardExp: 8000, rewardLinhThach: 8000, rewardItems: ["hoa_thien_ling", "ngoc_than"], order: 9 },
    { id: "kimdan_main_02",   code: "M010", name: "Vào Âm Linh Điện",          description: "Tô Nguyệt Ly phát hiện bản đồ dẫn đến Âm Linh Điện — nơi Tịch Thiên Điện phong ấn linh mạch thượng cổ. Hãy khám phá bí cảnh này.",         type: "main",  npcName: "Tô Nguyệt Ly",     realmRequired: "trucco",   progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 5000, rewardLinhThach: 3000, rewardItems: ["khai_tam_dan", "ngoc_than"], order: 10 },
    { id: "kimdan_main_03",   code: "M011", name: "Chinh Phục Hỏa Mãng Xà",   description: "Hàn Dạ thách ngươi tiêu diệt Hỏa Mãng Xà Thần trước khi hắn làm. Kẻ thắng sẽ được Lăng Vân Sinh truyền thụ bí kíp thất truyền.",           type: "npc",   npcName: "Hàn Dạ",           realmRequired: "trucco",   progressMax: 1, objectiveType: "boss_kill",   rewardExp: 6000, rewardLinhThach: 4000, rewardItems: ["kiem_linh", "hoa_tinh_thach"], order: 11 },
    // Main quests — Nguyên Anh
    { id: "nguyenanh_main_01",code: "M012", name: "Nguyên Anh Xuất Thế",       description: "Nguyên Anh thoát xác — bước tiến vượt ngoài nhân loại. Lăng Vân Sinh cảnh báo: con đường từ đây sẽ cô độc hơn bao giờ hết. Hãy đột phá!", type: "realm", npcName: "Lăng Vân Sinh",     realmRequired: "kimdan",   progressMax: 1, objectiveType: "breakthrough", rewardExp: 20000, rewardLinhThach: 20000, rewardItems: ["hoa_thien_ling"], order: 12 },
    { id: "nguyenanh_main_02",code: "M013", name: "Đối Đầu Tịch Thiên",       description: "Tô Nguyệt Ly giải mã được cổ thư: Lôi Long Cổ Thần là chìa khóa phá vỡ phong ấn của Tịch Thiên Điện. Hãy đối mặt với kẻ thù thực sự.", type: "main",  npcName: "Tô Nguyệt Ly",     realmRequired: "kimdan",   progressMax: 1, objectiveType: "boss_kill",   rewardExp: 15000, rewardLinhThach: 10000, rewardItems: ["hoa_thien_ling"], order: 13 },
    // Sect quests — Phàm Nhân
    { id: "phamnhan_sect_01", code: "S001", name: "Gia Nhập Hoa Thiên Môn",   description: "Chấp Sự Hoa Thiên yêu cầu ngươi chính thức gia nhập tông môn. Đây là bước đầu tiên trở thành đệ tử thực sự.",                           type: "sect",  npcName: "Chấp Sự Hoa Thiên", realmRequired: null,       progressMax: 1, objectiveType: null,          rewardExp: 200,  rewardLinhThach: 300,  rewardItems: [],                order: 1 },
    { id: "phamnhan_sect_02", code: "S002", name: "Bảo Vệ Tông Môn Sơn Môn", description: "Chấp Sự Hoa Thiên giao nhiệm vụ tuần tra. Vào Thanh Khê Cốc tiêu diệt dã thú đang uy hiếp tông môn.",                                    type: "sect",  npcName: "Chấp Sự Hoa Thiên", realmRequired: null,       progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 300,  rewardLinhThach: 400,  rewardItems: ["hoi_khi_dan"],   order: 2 },
    // Sect quests — Luyện Khí
    { id: "luyenkhi_sect_01", code: "S003", name: "Cung Nạp Tài Nguyên",      description: "Tông môn cần tài nguyên để duy trì hoạt động. Thu thập Thiết Tinh Quặng từ Cổ Quặng Mỏ nộp cho Chấp Sự.",                                type: "sect",  npcName: "Chấp Sự Hoa Thiên", realmRequired: "phamnhan", progressMax: 3, objectiveType: null,          rewardExp: 600,  rewardLinhThach: 800,  rewardItems: ["moc_linh_phu"],  order: 3 },
    // Sect quests — Kim Đan
    { id: "kimdan_sect_01",   code: "S004", name: "Triển Lãm Lực Chiến",      description: "Chấp Sự Hoa Thiên yêu cầu các Kim Đan tu sĩ trình diễn thực lực. Chinh phục Lôi Nguyên Đỉnh để bảo vệ danh tiếng tông môn.",              type: "sect",  npcName: "Chấp Sự Hoa Thiên", realmRequired: "trucco",   progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 3000, rewardLinhThach: 2000, rewardItems: ["ngoc_boi_linh"], order: 4 },
    // Grind quests
    { id: "phamnhan_grind_01", code: "G001", name: "Tu Luyện Hàng Ngày",      description: "Bảng Nhiệm Vụ: Tu luyện nhập định mỗi ngày. Linh khí trời đất không uổng công người kiên trì.",                                           type: "grind", npcName: "Bảng Nhiệm Vụ",    realmRequired: null,       progressMax: 1, objectiveType: "cultivate",   rewardExp: 100,  rewardLinhThach: 150,  rewardItems: [],                order: 1 },
    { id: "phamnhan_grind_02", code: "G002", name: "Đả Quái Kiếm Điểm",       description: "Bảng Nhiệm Vụ: Vào bí cảnh Thanh Khê Cốc tiêu diệt dã thú để tích lũy kinh nghiệm chiến đấu.",                                           type: "grind", npcName: "Bảng Nhiệm Vụ",    realmRequired: null,       progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 200,  rewardLinhThach: 300,  rewardItems: ["hoi_khi_dan"],   order: 2 },
    { id: "luyenkhi_grind_01", code: "G003", name: "Thu Thập Dược Liệu",      description: "Bảng Nhiệm Vụ: Thu thập dược liệu hàng ngày để duy trì nguồn đan dược cho tông môn.",                                                     type: "grind", npcName: "Bảng Nhiệm Vụ",    realmRequired: "phamnhan", progressMax: 5, objectiveType: null,          rewardExp: 300,  rewardLinhThach: 400,  rewardItems: ["linh_chi"],      order: 3 },
    { id: "kimdan_grind_01",   code: "G004", name: "Luyện Đan Hàng Ngày",     description: "Bảng Nhiệm Vụ: Kim Đan tu sĩ cần duy trì công phu luyện đan mỗi ngày để giữ vững cảnh giới.",                                             type: "grind", npcName: "Bảng Nhiệm Vụ",    realmRequired: "trucco",   progressMax: 1, objectiveType: "alchemy_craft", rewardExp: 500,  rewardLinhThach: 600,  rewardItems: ["khai_tam_dan"],  order: 4 },
    { id: "nguyenanh_grind_01",code: "G005", name: "Nguyên Anh Thiền Định",   description: "Bảng Nhiệm Vụ: Nguyên Anh tu sĩ ngồi thiền hấp thu linh khí vũ trụ mỗi ngày để củng cố Nguyên Anh.",                                     type: "grind", npcName: "Bảng Nhiệm Vụ",    realmRequired: "kimdan",   progressMax: 1, objectiveType: "cultivate",   rewardExp: 800,  rewardLinhThach: 1000, rewardItems: ["truc_co_dan"],   order: 5 },
    // NPC quests
    { id: "npc_moc_001",       code: "N001", name: "Dược Phương Bí Truyền",   description: "Mộc Thanh Y nhờ ngươi tìm kiếm Linh Chi Hoang — nguyên liệu chính trong dược phương bí truyền của đại sư tỷ.",                           type: "npc",   npcName: "Mộc Thanh Y",       realmRequired: null,       progressMax: 5, objectiveType: null,          rewardExp: 300,  rewardLinhThach: 500,  rewardItems: ["truc_co_dan"],   order: 1 },
    { id: "npc_han_da_001",    code: "N002", name: "Rival — Chứng Minh Thực Lực", description: "Hàn Dạ không phục tài năng của ngươi. Hắn thách ngươi hoàn thành bí cảnh Cổ Quặng Mỏ trước khi hắn làm.",                        type: "npc",   npcName: "Hàn Dạ",           realmRequired: "phamnhan", progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 800,  rewardLinhThach: 1000, rewardItems: ["kiem_linh"],     order: 1 },
    { id: "npc_to_nguyet_001", code: "N003", name: "Lore Ẩn — Ký Ức Hoa Thiên", description: "Tô Nguyệt Ly tìm thấy một mảnh cổ thư trong thư khố. Nàng nhờ ngươi dịch ký ức linh lực từ Hỏa Tinh Thạch.",                        type: "npc",   npcName: "Tô Nguyệt Ly",     realmRequired: "luyenkhi", progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 1200, rewardLinhThach: 1500, rewardItems: ["hoa_thien_ling"], order: 1 },
    { id: "npc_moc_002",       code: "N004", name: "Luyện Đan Sư Thiên Tài",  description: "Mộc Thanh Y nghe tin về một bí pháp luyện đan thất truyền. Nàng nhờ ngươi thu thập nguyên liệu quý để thử nghiệm công thức mới.",          type: "npc",   npcName: "Mộc Thanh Y",       realmRequired: "trucco",   progressMax: 3, objectiveType: "alchemy_craft", rewardExp: 2000, rewardLinhThach: 2500, rewardItems: ["khai_tam_dan", "ngoc_boi_linh"], order: 2 },
    { id: "npc_han_da_002",    code: "N005", name: "Thiên Long Kiếm Ý",       description: "Hàn Dạ đã đạt ngộ Kiếm Ý từ trận chiến Lôi Nguyên Đỉnh. Hắn muốn ngươi cùng chinh phục bí cảnh đó để cùng tiến bộ.",                    type: "npc",   npcName: "Hàn Dạ",           realmRequired: "kimdan",   progressMax: 1, objectiveType: "dungeon_clear", rewardExp: 5000, rewardLinhThach: 3000, rewardItems: ["ngoc_than"], order: 2 },
    { id: "npc_moc_aff_20",    code: "N006", name: "Lời Dặn Trong Vườn Dược", description: "Khi đã quen biết, Mộc Thanh Y tin ngươi đủ cẩn trọng để chăm sóc luống dược thảo non trong hậu sơn.", type: "npc", npcName: "Mộc Thanh Y", realmRequired: null, progressMax: 1, objectiveType: "cultivate", affinityRequired: 20, rewardExp: 250, rewardLinhThach: 250, rewardItems: ["linh_chi"], order: 3 },
    { id: "npc_han_aff_50",    code: "N007", name: "Kiếm Luận Sau Hoàng Hôn", description: "Khi đã thân thiết, Hàn Dạ chịu hạ giọng và rủ ngươi luận kiếm thật sự thay vì chỉ khiêu khích.", type: "npc", npcName: "Hàn Dạ", realmRequired: "luyenkhi", progressMax: 1, objectiveType: "dungeon_clear", affinityRequired: 50, rewardExp: 900, rewardLinhThach: 700, rewardItems: ["kim_quang_dan"], order: 3 },
    { id: "npc_to_aff_80",     code: "N008", name: "Bí Mật Dưới Trăng", description: "Khi đã là tri kỷ, Tô Nguyệt Ly tiết lộ đoạn ký ức bị phong ấn và nhờ ngươi xác nhận dấu vết Tịch Thiên.", type: "npc", npcName: "Tô Nguyệt Ly", realmRequired: "trucco", progressMax: 1, objectiveType: "boss_kill", affinityRequired: 80, rewardExp: 1800, rewardLinhThach: 1200, rewardItems: ["hoa_thien_ling"], order: 2 },
  ]).onConflictDoNothing();

  // ── NPCs ────────────────────────────────────────────────────────────────────
  await db.insert(npcsTable).values([
    {
      id: "lang_van_sinh", name: "Lăng Vân Sinh", title: "Chưởng Môn Hoa Thiên Môn", faction: "hoa_thien_mon",
      role: "quest_giver", element: "kim",
      description: "Chưởng Môn hiện tại của Hoa Thiên Môn. Một trong số ít cường giả còn sống sót từ thời đại hoàng kim của tông môn. Ông là người thu nhận ngươi làm ngoại môn đệ tử, nhìn thấy tiềm năng ẩn sâu bên trong.",
      dialogue: {
        greet: "Ta đã đợi ngươi lâu rồi, hậu bối. Hoa Thiên Môn cần những người như ngươi để khôi phục vinh quang xưa.",
        quest: "Hành trình tu tiên không bao giờ dễ dàng. Nhưng ta tin tưởng ngươi sẽ vượt qua.",
        farewell: "Đi đi. Đạo lộ trước mặt ngươi còn rất dài.",
      },
      questIds: ["phamnhan_main_01", "luyenkhi_main_01", "truc_co_main_01", "kimdan_main_01", "nguyenanh_main_01"],
      avatarCode: "LVS",
    },
    {
      id: "moc_thanh_y", name: "Mộc Thanh Y", title: "Đại Sư Tỷ — Hoa Thiên Môn", faction: "hoa_thien_mon",
      role: "tutorial_npc", element: "moc",
      description: "Đại sư tỷ thân thiện, tinh thông Mộc hệ dược thuật và linh pháp chữa lành. Nàng là người đầu tiên hướng dẫn ngươi nhập môn, luôn ôn hòa và bao dung với đệ tử mới.",
      dialogue: {
        greet: "Chào sư đệ! Ta sẽ giúp ngươi làm quen với tông môn. Đừng ngại hỏi ta bất cứ điều gì.",
        greet_quen_biet: "Sư đệ đến đúng lúc. Vườn dược hôm nay yên tĩnh, ta có thể chỉ ngươi vài mẹo dưỡng linh thảo.",
        greet_than_thiet: "Ta đã để riêng một lô dược liệu tốt cho ngươi. Đừng khách khí, người trong môn nên giúp nhau.",
        greet_tri_ky: "Có những dược phương ta chưa từng nói với ai. Nếu là ngươi, ta tin có thể cùng nghiên cứu.",
        quest: "Ta cần một ít Linh Thảo để bào chế thuốc chữa thương. Ngươi có thể giúp ta được không?",
        farewell: "Cẩn thận nhé, sư đệ. Mộc hệ linh khí sẽ luôn chữa lành vết thương cho ngươi.",
      },
      questIds: ["phamnhan_main_02", "npc_moc_001", "luyenkhi_main_02", "npc_moc_002", "npc_moc_aff_20"],
      avatarCode: "MTY",
    },
    {
      id: "han_da", name: "Hàn Dạ", title: "Nội Môn Đệ Tử — Hoa Thiên Môn", faction: "hoa_thien_mon",
      role: "rival_npc", element: "loi",
      description: "Hàn Dạ — đệ tử nội môn kiêu ngạo, tài năng nhưng ưa tranh đấu. Hắn luôn thách thức ngươi để chứng tỏ bản thân, nhưng thực ra trong lòng hắn coi ngươi là đối thủ xứng đáng nhất.",
      dialogue: {
        greet: "Ngươi lại đến à. Thực lực ngươi có tăng lên không, hay vẫn chỉ là phàm nhân tầm thường?",
        greet_quen_biet: "Ngươi cũng không tệ. Ít nhất ta không thấy nhàm chán khi ngươi xuất hiện.",
        greet_than_thiet: "Được, hôm nay không khiêu khích. Ta muốn luận kiếm nghiêm túc với ngươi.",
        greet_tri_ky: "Nếu có ngày ta thua, người đầu tiên ta muốn thấy đứng trước mặt mình chính là ngươi.",
        quest: "Ta thách ngươi! Ai hoàn thành trước thì người đó là thiên tài thực sự của Hoa Thiên Môn!",
        farewell: "Đừng để ta phải chờ lâu. Ta sẽ không giả vờ ngươi yếu nếu ngươi thua.",
      },
      questIds: ["phamnhan_main_03", "npc_han_da_001", "luyenkhi_main_03", "kimdan_main_03", "npc_han_da_002", "npc_han_aff_50"],
      avatarCode: "HD",
    },
    {
      id: "to_nguyet_ly", name: "Tô Nguyệt Ly", title: "Đệ Tử Bí Ẩn — Hoa Thiên Môn", faction: "hoa_thien_mon",
      role: "lore_npc", element: "thuy",
      description: "Cô gái bí ẩn với đôi mắt sâu thẳm như đáy biển. Tô Nguyệt Ly ít nói nhưng luôn nắm giữ những bí mật về lịch sử thượng cổ của Hoa Thiên Môn và sự kiện Đại Kiếp.",
      dialogue: {
        greet: "Ngươi cũng cảm nhận được không? Có điều gì đó đang thức dậy trong linh mạch này...",
        greet_quen_biet: "Ngươi đã nghe được tiếng linh mạch rõ hơn trước. Có lẽ ta không phải người duy nhất cảm nhận điều đó.",
        greet_than_thiet: "Ta đã chép lại vài đoạn cổ văn. Đọc cùng ta, nhưng đừng để Chấp Sự nhìn thấy.",
        greet_tri_ky: "Đêm nay trăng sáng. Có một bí mật về Tịch Thiên Điện, ta chỉ dám nói với ngươi.",
        quest: "Ta tìm thấy một mảnh cổ thư đề cập đến Hoa Thiên Khai Đạo. Nhưng ta cần ngươi giúp xác nhận.",
        farewell: "Đừng tiết lộ điều này với ai. Tịch Thiên Điện luôn có mắt ở khắp nơi.",
      },
      questIds: ["phamnhan_main_04", "npc_to_nguyet_001", "kimdan_main_02", "nguyenanh_main_02", "npc_to_aff_80"],
      avatarCode: "TNL",
    },
    {
      id: "chap_su_hoa_thien", name: "Chấp Sự Hoa Thiên", title: "Chấp Sự Đường — Hoa Thiên Môn", faction: "hoa_thien_mon",
      role: "sect_npc", element: "tho",
      description: "Quan chức tông môn phụ trách nhiệm vụ hàng ngày và tài nguyên. Ông nghiêm khắc nhưng công bằng, đảm bảo mọi đệ tử đều đóng góp cho sự phục hưng của tông môn.",
      dialogue: {
        greet: "Đệ tử, tông môn luôn cần người có đóng góp. Hãy nhận nhiệm vụ và chứng minh giá trị của mình.",
        quest: "Tài nguyên của tông môn đang cạn kiệt. Nhiệm vụ này cần ngươi hoàn thành gấp.",
        farewell: "Cống hiến cho tông môn là vinh dự của mỗi đệ tử Hoa Thiên.",
      },
      questIds: ["phamnhan_sect_01", "phamnhan_sect_02", "luyenkhi_sect_01", "kimdan_sect_01"],
      avatarCode: "CSH",
    },
    {
      id: "bang_nhiem_vu", name: "Bảng Nhiệm Vụ", title: "Hoa Thiên Môn Nhiệm Vụ Đường", faction: "hoa_thien_mon",
      role: "board_npc", element: null,
      description: "Bảng nhiệm vụ tự động của Hoa Thiên Môn. Nhiệm vụ hàng ngày và grinding quest được cập nhật liên tục để giúp đệ tử rèn luyện.",
      dialogue: {
        greet: "Bảng Nhiệm Vụ Hoa Thiên Môn — Chọn nhiệm vụ phù hợp với thực lực.",
        quest: "Nhiệm vụ hàng ngày đã được cập nhật. Hãy hoàn thành để nhận thưởng!",
        farewell: "Nhiệm vụ hoàn thành. Phần thưởng đã được ghi nhận.",
      },
      questIds: ["phamnhan_grind_01", "phamnhan_grind_02", "luyenkhi_grind_01", "kimdan_grind_01", "nguyenanh_grind_01"],
      avatarCode: "BNV",
    },
  ]).onConflictDoNothing();

  await db.update(npcsTable).set({
    dialogue: {
      greet: "Chào sư đệ! Ta sẽ giúp ngươi làm quen với tông môn. Đừng ngại hỏi ta bất cứ điều gì.",
      greet_quen_biet: "Sư đệ đến đúng lúc. Vườn dược hôm nay yên tĩnh, ta có thể chỉ ngươi vài mẹo dưỡng linh thảo.",
      greet_than_thiet: "Ta đã để riêng một lô dược liệu tốt cho ngươi. Đừng khách khí, người trong môn nên giúp nhau.",
      greet_tri_ky: "Có những dược phương ta chưa từng nói với ai. Nếu là ngươi, ta tin có thể cùng nghiên cứu.",
      quest: "Ta cần một ít Linh Thảo để bào chế thuốc chữa thương. Ngươi có thể giúp ta được không?",
      farewell: "Cẩn thận nhé, sư đệ. Mộc hệ linh khí sẽ luôn chữa lành vết thương cho ngươi.",
    },
    questIds: ["phamnhan_main_02", "npc_moc_001", "luyenkhi_main_02", "npc_moc_002", "npc_moc_aff_20"],
  }).where(eq(npcsTable.id, "moc_thanh_y"));
  await db.update(npcsTable).set({
    dialogue: {
      greet: "Ngươi lại đến à. Thực lực ngươi có tăng lên không, hay vẫn chỉ là phàm nhân tầm thường?",
      greet_quen_biet: "Ngươi cũng không tệ. Ít nhất ta không thấy nhàm chán khi ngươi xuất hiện.",
      greet_than_thiet: "Được, hôm nay không khiêu khích. Ta muốn luận kiếm nghiêm túc với ngươi.",
      greet_tri_ky: "Nếu có ngày ta thua, người đầu tiên ta muốn thấy đứng trước mặt mình chính là ngươi.",
      quest: "Ta thách ngươi! Ai hoàn thành trước thì người đó là thiên tài thực sự của Hoa Thiên Môn!",
      farewell: "Đừng để ta phải chờ lâu. Ta sẽ không giả vờ ngươi yếu nếu ngươi thua.",
    },
    questIds: ["phamnhan_main_03", "npc_han_da_001", "luyenkhi_main_03", "kimdan_main_03", "npc_han_da_002", "npc_han_aff_50"],
  }).where(eq(npcsTable.id, "han_da"));
  await db.update(npcsTable).set({
    dialogue: {
      greet: "Ngươi cũng cảm nhận được không? Có điều gì đó đang thức dậy trong linh mạch này...",
      greet_quen_biet: "Ngươi đã nghe được tiếng linh mạch rõ hơn trước. Có lẽ ta không phải người duy nhất cảm nhận điều đó.",
      greet_than_thiet: "Ta đã chép lại vài đoạn cổ văn. Đọc cùng ta, nhưng đừng để Chấp Sự nhìn thấy.",
      greet_tri_ky: "Đêm nay trăng sáng. Có một bí mật về Tịch Thiên Điện, ta chỉ dám nói với ngươi.",
      quest: "Ta tìm thấy một mảnh cổ thư đề cập đến Hoa Thiên Khai Đạo. Nhưng ta cần ngươi giúp xác nhận.",
      farewell: "Đừng tiết lộ điều này với ai. Tịch Thiên Điện luôn có mắt ở khắp nơi.",
    },
    questIds: ["phamnhan_main_04", "npc_to_nguyet_001", "kimdan_main_02", "nguyenanh_main_02", "npc_to_aff_80"],
  }).where(eq(npcsTable.id, "to_nguyet_ly"));

  // ── Sects ───────────────────────────────────────────────────────────────────
  await db.insert(sectsTable).values([
    { id: "sect_hoa_thien",  name: "Hoa Thiên Môn",  level: 5, maxMembers: 200, treasuryLinhThach: 80000,  description: "Tông phái cổ xưa theo đuổi Hoa Thiên Đạo, từng là đại đạo thống dẫn dắt tu tiên giới. Sau Thượng Cổ Đại Kiếp, tông môn suy tàn nhưng tinh thần vẫn còn.", leaderName: "Lăng Vân Sinh" },
    { id: "sect_kiem_dao",   name: "Kiếm Đạo Tông",  level: 5, maxMembers: 100, treasuryLinhThach: 50000,  description: "Tông phái kiếm thuật đỉnh cao, nơi rèn giũa những kiếm khách tuyệt đỉnh.",                                                                                    leaderName: "Kiếm Thánh Huyền Thanh" },
    { id: "sect_long_van",   name: "Long Vân Tông",  level: 4, maxMembers: 80,  treasuryLinhThach: 35000,  description: "Tông phái cưỡi long, vận dụng sức mạnh rồng thiêng.",                                                                                                         leaderName: "Long Vương Trấn Sơn" },
    { id: "sect_linh_tue",   name: "Linh Tuệ Các",   level: 3, maxMembers: 60,  treasuryLinhThach: 20000,  description: "Nơi tập hợp tu sĩ thông tuệ, chú trọng đan dược và pháp thuật.",                                                                                               leaderName: "Đại Dược Sư Vĩnh Hòa" },
    { id: "sect_vo_cuc",     name: "Vô Cực Môn",     level: 6, maxMembers: 150, treasuryLinhThach: 100000, description: "Môn phái lâu đời, vô cực đại đạo bao hàm mọi con đường tu tiên.",                                                                                              leaderName: "Vô Cực Chưởng Môn" },
  ]).onConflictDoNothing();

  // ── Achievement Templates ───────────────────────────────────────────────────
  await db.insert(achievementTemplatesTable).values([
    // Bí Cảnh (Dungeon)
    { id: "dungeon_first",   name: "Sơ Nhập Bí Cảnh",      description: "Hoàn thành bí cảnh đầu tiên trong đời tu tiên.",                                category: "combat",      conditionType: "dungeon_clear", conditionValue: 1,   rewardLinhThach: 50,   rewardTitle: null,              icon: "⚔", sortOrder: 10 },
    { id: "dungeon_10",      name: "Dũng Mãnh Vô Song",     description: "Hoàn thành 10 lần chinh phục bí cảnh.",                                         category: "combat",      conditionType: "dungeon_clear", conditionValue: 10,  rewardLinhThach: 200,  rewardTitle: null,              icon: "⚔", sortOrder: 11 },
    { id: "dungeon_30",      name: "Chinh Phục Bí Cảnh",    description: "Hoàn thành 30 lần chinh phục bí cảnh, tên vang lừng tu tiên giới.",             category: "combat",      conditionType: "dungeon_clear", conditionValue: 30,  rewardLinhThach: 500,  rewardTitle: "Thám Hiểm Gia",   icon: "⚔", sortOrder: 12 },
    { id: "dungeon_50",      name: "Bí Cảnh Vương",         description: "50 lần chinh phục bí cảnh — không bí cảnh nào có thể ngăn bước chân ngươi.",    category: "combat",      conditionType: "dungeon_clear", conditionValue: 50,  rewardLinhThach: 1000, rewardTitle: "Bí Cảnh Vương",   icon: "⚔", sortOrder: 13 },
    { id: "dungeon_100",     name: "Thiên Địa Vô Địch",     description: "100 lần chinh phục! Ngươi là huyền thoại của bí cảnh tu tiên.",                  category: "combat",      conditionType: "dungeon_clear", conditionValue: 100, rewardLinhThach: 2000, rewardTitle: "Vô Địch Thế Gian", icon: "⚔", sortOrder: 14 },
    // Boss
    { id: "boss_first",      name: "Chém Quái Sơ Trận",     description: "Lần đầu tiêu diệt một Boss thế giới.",                                          category: "combat",      conditionType: "boss_kill",     conditionValue: 1,   rewardLinhThach: 100,  rewardTitle: null,              icon: "☠", sortOrder: 20 },
    { id: "boss_5",          name: "Đả Sát Hùng Thú",       description: "Tiêu diệt 5 Boss — danh tiếng bắt đầu lan xa.",                                 category: "combat",      conditionType: "boss_kill",     conditionValue: 5,   rewardLinhThach: 300,  rewardTitle: null,              icon: "☠", sortOrder: 21 },
    { id: "boss_20",         name: "Thiên Địa Chiến Thần",  description: "20 Boss bị tiêu diệt bởi tay ngươi — thần chiến đích thực.",                    category: "combat",      conditionType: "boss_kill",     conditionValue: 20,  rewardLinhThach: 1000, rewardTitle: "Chiến Thần",      icon: "☠", sortOrder: 22 },
    // Đột Phá (Realm Breakthrough)
    { id: "realm_luyenkhi",  name: "Luyện Khí Sơ Khai",     description: "Đột phá thành công lên Luyện Khí — chính thức bước vào con đường tu tiên.",     category: "cultivation", conditionType: "breakthrough_realm", conditionValue: 1, conditionData: { realmKey: "luyenkhi" }, rewardLinhThach: 200,  rewardTitle: null,              icon: "☯", sortOrder: 30 },
    { id: "realm_trucco",    name: "Trúc Cơ Thành Công",    description: "Đạt cảnh giới Trúc Cơ — bước ngoặt quan trọng nhất đời tu tiên.",               category: "cultivation", conditionType: "breakthrough_realm", conditionValue: 1, conditionData: { realmKey: "trucco" },   rewardLinhThach: 500,  rewardTitle: "Trúc Cơ Tu Sĩ",  icon: "☯", sortOrder: 31 },
    { id: "realm_kimdan",    name: "Kim Đan Viên Mãn",      description: "Đạt Kim Đan — một trong vạn tu sĩ mới thành tựu được.",                         category: "cultivation", conditionType: "breakthrough_realm", conditionValue: 1, conditionData: { realmKey: "kimdan" },   rewardLinhThach: 2000, rewardTitle: "Kim Đan Chân Nhân", icon: "☯", sortOrder: 32 },
    { id: "realm_nguyenanh", name: "Nguyên Anh Xuất Thế",   description: "Nguyên Anh thoát xác — vượt ngoài ranh giới con người.",                        category: "cultivation", conditionType: "breakthrough_realm", conditionValue: 1, conditionData: { realmKey: "nguyenanh" }, rewardLinhThach: 5000, rewardTitle: "Nguyên Anh Tôn Giả", icon: "☯", sortOrder: 33 },
    // Nhiệm Vụ (Quest)
    { id: "quest_1",         name: "Chân Tu Sơ Bộ",         description: "Hoàn thành nhiệm vụ đầu tiên.",                                                 category: "social",      conditionType: "quest_complete", conditionValue: 1,  rewardLinhThach: 50,   rewardTitle: null,              icon: "✦", sortOrder: 40 },
    { id: "quest_5",         name: "Cần Chỉ Chịu Khó",      description: "Hoàn thành 5 nhiệm vụ.",                                                        category: "social",      conditionType: "quest_complete", conditionValue: 5,  rewardLinhThach: 100,  rewardTitle: null,              icon: "✦", sortOrder: 41 },
    { id: "quest_10",        name: "Tiệm Tiến Tu Đạo",      description: "Hoàn thành 10 nhiệm vụ.",                                                       category: "social",      conditionType: "quest_complete", conditionValue: 10, rewardLinhThach: 200,  rewardTitle: null,              icon: "✦", sortOrder: 42 },
    { id: "quest_20",        name: "Hoàn Hảo Vô Khuyết",    description: "Hoàn thành 20 nhiệm vụ — không một nhiệm vụ nào bị bỏ lỡ.",                    category: "social",      conditionType: "quest_complete", conditionValue: 20, rewardLinhThach: 500,  rewardTitle: "Chuyên Nghiệp",   icon: "✦", sortOrder: 43 },
    // Pháp Thuật (Skill)
    { id: "skill_first",     name: "Pháp Thuật Sơ Khai",    description: "Học được pháp thuật đầu tiên.",                                                 category: "skill",       conditionType: "skill_learn",    conditionValue: 1,  rewardLinhThach: 100,  rewardTitle: null,              icon: "✺", sortOrder: 50 },
    { id: "skill_3",         name: "Pháp Thuật Học Giả",    description: "Nắm vững 3 pháp thuật.",                                                        category: "skill",       conditionType: "skill_learn",    conditionValue: 3,  rewardLinhThach: 200,  rewardTitle: null,              icon: "✺", sortOrder: 51 },
    { id: "skill_5",         name: "Pháp Thuật Đại Sư",     description: "Tinh thông 5 pháp thuật — hàng đầu Hoa Thiên Môn.",                            category: "skill",       conditionType: "skill_learn",    conditionValue: 5,  rewardLinhThach: 500,  rewardTitle: "Pháp Thuật Đại Sư", icon: "✺", sortOrder: 52 },
    { id: "skill_7",         name: "Vạn Pháp Quy Tông",     description: "Học đủ 7 pháp thuật — toàn bộ kho tàng Hoa Thiên Môn.",                        category: "skill",       conditionType: "skill_learn",    conditionValue: 7,  rewardLinhThach: 1000, rewardTitle: "Vạn Pháp Tôn Giả", icon: "✺", sortOrder: 53 },
    // Luyện Đan (Alchemy)
    { id: "alchemy_first",   name: "Luyện Đan Sơ Thành",    description: "Chế tạo thành công đan dược đầu tiên.",                                         category: "alchemy",     conditionType: "alchemy_craft",  conditionValue: 1,  rewardLinhThach: 100,  rewardTitle: null,              icon: "⊛", sortOrder: 60 },
    { id: "alchemy_10",      name: "Luyện Đan Thuần Thục",  description: "Chế tạo 10 đan dược thành công.",                                               category: "alchemy",     conditionType: "alchemy_craft",  conditionValue: 10, rewardLinhThach: 300,  rewardTitle: "Đan Sư",          icon: "⊛", sortOrder: 61 },
    { id: "alchemy_30",      name: "Đan Đạo Tông Sư",       description: "30 lần luyện đan thành công — đủ tư cách là Đại Đan Sư.",                      category: "alchemy",     conditionType: "alchemy_craft",  conditionValue: 30, rewardLinhThach: 800,  rewardTitle: "Đại Đan Sư",      icon: "⊛", sortOrder: 62 },
    // Cấp Độ (Level)
    { id: "level_5",         name: "Tiệm Tiến Tu Tiên",     description: "Đạt cấp 5 qua quá trình đột phá.",                                             category: "cultivation", conditionType: "level",          conditionValue: 5,  rewardLinhThach: 100,  rewardTitle: null,              icon: "◆", sortOrder: 70 },
    { id: "level_10",        name: "Tu Tiên Có Thành",       description: "Đạt cấp 10.",                                                                   category: "cultivation", conditionType: "level",          conditionValue: 10, rewardLinhThach: 300,  rewardTitle: "Lão Tu Sĩ",       icon: "◆", sortOrder: 71 },
  ]).onConflictDoNothing();

  // ── Alchemy Recipes ──────────────────────────────────────────────────────────
  await db.insert(alchemyRecipesTable).values([
    { id: "recipe_hoi_khi_dan",   name: "Luyện Hồi Khí Đan",       description: "Công thức cơ bản nhất — dùng Linh Thảo và Linh Chi luyện thành đan hồi phục.", inputItems: [{ itemId: "linh_thao", qty: 2 }, { itemId: "linh_chi", qty: 1 }],         outputItemId: "hoi_khi_dan",   outputQty: 1, successRate: 1.0,  linhThachCost: 30,  requiredRealm: null,       sortOrder: 1 },
    { id: "recipe_khai_tam_dan",  name: "Luyện Khai Tâm Đan",      description: "Dùng Linh Thảo và Trúc Diệp Thanh luyện đan khai sáng trí tuệ.",              inputItems: [{ itemId: "linh_thao", qty: 3 }, { itemId: "truc_diep", qty: 1 }],          outputItemId: "khai_tam_dan",  outputQty: 1, successRate: 0.9,  linhThachCost: 80,  requiredRealm: null,       sortOrder: 2 },
    { id: "recipe_thuy_linh_thu", name: "Luyện Thủy Linh Thủy",    description: "Pha chế Linh Chi và Linh Thảo thành thủy dịch hồi phục mạnh.",                inputItems: [{ itemId: "linh_chi", qty: 3 }, { itemId: "linh_thao", qty: 2 }],           outputItemId: "thuy_linh_thu", outputQty: 1, successRate: 0.85, linhThachCost: 100, requiredRealm: "phamnhan",  sortOrder: 3 },
    { id: "recipe_moc_linh_phu",  name: "Luyện Mộc Linh Phù",      description: "Kết hợp Linh Chi và Trúc Diệp luyện thành linh phù Mộc hệ.",                  inputItems: [{ itemId: "linh_chi", qty: 2 }, { itemId: "truc_diep", qty: 2 }],           outputItemId: "moc_linh_phu",  outputQty: 1, successRate: 0.85, linhThachCost: 120, requiredRealm: "phamnhan",  sortOrder: 4 },
    { id: "recipe_kim_quang_dan", name: "Luyện Kim Quang Đan",      description: "Dùng Hỏa Tinh Thạch và Thiết Tinh Quặng luyện đan tăng công kích.",            inputItems: [{ itemId: "hoa_tinh_thach", qty: 1 }, { itemId: "thiet_tinh", qty: 2 }],   outputItemId: "kim_quang_dan", outputQty: 2, successRate: 0.8,  linhThachCost: 150, requiredRealm: "luyenkhi",  sortOrder: 5 },
    { id: "recipe_truc_co_dan",   name: "Luyện Trúc Cơ Đan",       description: "Công thức quý — Trúc Diệp Thanh và Khai Tâm Đan luyện thành đan tăng tu vi.", inputItems: [{ itemId: "truc_diep", qty: 3 }, { itemId: "khai_tam_dan", qty: 1 }],        outputItemId: "truc_co_dan",   outputQty: 1, successRate: 0.75, linhThachCost: 200, requiredRealm: "luyenkhi",  sortOrder: 6 },
    { id: "recipe_hoa_tinh",      name: "Tinh Luyện Hỏa Tinh Thạch", description: "Nung Thổ Cốt Thú lấy tinh chất Hỏa để tạo Hỏa Tinh Thạch.",               inputItems: [{ itemId: "tho_cot_thu", qty: 5 }],                                           outputItemId: "hoa_tinh_thach",outputQty: 2, successRate: 0.8,  linhThachCost: 100, requiredRealm: "phamnhan",  sortOrder: 7 },
    { id: "recipe_ngoc_than",     name: "Nung Luyện Ngọc Thần Thạch", description: "Công thức cấp cao — luyện quặng sắt tinh và xương linh thú tạo thành Ngọc Thần Thạch.", inputItems: [{ itemId: "thiet_tinh", qty: 5 }, { itemId: "tho_cot_thu", qty: 3 }], outputItemId: "ngoc_than",     outputQty: 1, successRate: 0.6,  linhThachCost: 300, requiredRealm: "trucco",    sortOrder: 8 },
  ]).onConflictDoNothing();

  // ── Battle Pass Season ───────────────────────────────────────────────────────
  const bpTiers: BattlePassTier[] = [
    { tier: 1,  xpRequired: 100,  linhThach: 200,  itemId: null,           title: null,                   isPremium: false },
    { tier: 2,  xpRequired: 250,  linhThach: 0,    itemId: "hoi_khi_dan",  title: null,                   isPremium: false },
    { tier: 3,  xpRequired: 450,  linhThach: 500,  itemId: null,           title: null,                   isPremium: false },
    { tier: 4,  xpRequired: 700,  linhThach: 0,    itemId: "khai_tam_dan", title: "Tu Sĩ Nhập Môn",      isPremium: false },
    { tier: 5,  xpRequired: 1000, linhThach: 800,  itemId: null,           title: null,                   isPremium: false },
    { tier: 6,  xpRequired: 1350, linhThach: 0,    itemId: "truc_co_dan",  title: null,                   isPremium: false },
    { tier: 7,  xpRequired: 1750, linhThach: 1000, itemId: null,           title: null,                   isPremium: false },
    { tier: 8,  xpRequired: 2200, linhThach: 0,    itemId: "khai_tam_dan", title: "Hoa Thiên Đệ Tử",     isPremium: false },
    { tier: 9,  xpRequired: 2700, linhThach: 1500, itemId: null,           title: null,                   isPremium: false },
    { tier: 10, xpRequired: 3200, linhThach: 2000, itemId: null,           title: "Thiên Tông Tinh Anh",  isPremium: false },
  ];
  const now = new Date();
  const seasonEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  await db.insert(battlePassSeasonsTable).values([
    {
      id: "season_01_khai_thien",
      name: "Mùa 1: Khai Thiên Lập Địa",
      startDate: now,
      endDate: seasonEnd,
      isActive: true,
      tiers: bpTiers,
    },
  ]).onConflictDoNothing();

  // ── Admin user ───────────────────────────────────────────────────────────────
  const adminPwHash = await hashPassword("admin123456");
  await db.insert(usersTable).values([
    { id: "admin-user-001", email: "admin@tutienlo.vn", passwordHash: adminPwHash, username: "QuanTriVien", role: "admin" },
  ]).onConflictDoNothing();

  console.log("Seed Hoa Thien Mon completed successfully!");
}

seed().catch(err => { console.error("Seed error:", err); process.exit(1); });
