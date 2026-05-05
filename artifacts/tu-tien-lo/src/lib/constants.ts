export const ELEMENT_NAMES: Record<string, string> = {
  kim: "Kim", moc: "Mộc", thuy: "Thủy", hoa: "Hỏa", tho: "Thổ",
  loi: "Lôi", phong: "Phong", bang: "Băng", doc: "Độc", am: "Âm", duong: "Dương",
};

export const ELEMENT_COLORS: Record<string, string> = {
  kim: "#FFD700", moc: "#22c55e", thuy: "#38bdf8", hoa: "#f97316",
  tho: "#a3a3a3", loi: "#c084fc", phong: "#6ee7b7", bang: "#e0f2fe",
  doc: "#84cc16", am: "#8b5cf6", duong: "#fbbf24",
};

export const QUALITY_LABELS: Record<string, string> = {
  pham: "Phàm", linh: "Linh", huyen: "Huyền", tien: "Tiên", than: "Thần",
};

export const QUALITY_COLORS: Record<string, string> = {
  pham: "#94a3b8", linh: "#22c55e", huyen: "#38bdf8", tien: "#a855f7", than: "#f59e0b",
};

export const QUALITY_GLOW: Record<string, string> = {
  pham: "", linh: "shadow-[0_0_8px_#22c55e44]", huyen: "shadow-[0_0_8px_#38bdf844]",
  tien: "shadow-[0_0_12px_#a855f766]", than: "shadow-[0_0_16px_#f59e0b99]",
};

export const GRADE_LABELS: Record<string, string> = {
  common: "Bình Thường", good: "Tốt", rare: "Hiếm", epic: "Sử Thi",
};

export const PROVERBS = [
  "Đạo khả đạo, phi thường đạo.",
  "Thiên hạ vạn vật sinh ư hữu, hữu sinh ư vô.",
  "Tri nhân giả trí, tự tri giả minh.",
  "Thượng thiện nhược thủy.",
  "Vi học nhật ích, vi đạo nhật tổn.",
  "Thánh nhân bất tích.",
  "Tín ngôn bất mỹ, mỹ ngôn bất tín.",
];

export const MISSION_TYPE_LABELS: Record<string, string> = {
  main: "Chính tuyến", realm: "Cảnh giới", sect: "Tông môn", npc: "Phụ tuyến", grind: "Cày lặp", event: "Sự kiện",
};

export const ITEM_TYPE_LABELS: Record<string, string> = {
  weapon: "Vũ Khí", armor: "Giáp", belt: "Đai Lưng", boots: "Giày", hat: "Mũ",
  accessory: "Phụ Kiện", pill: "Đan Dược", herb: "Thảo Dược", ore: "Nguyên Liệu",
  key: "Chìa Khóa", artifact: "Pháp Bảo", misc: "Khác",
};

export const ITEM_TYPE_FILTER_TABS = [
  { value: "", label: "Tất cả" },
  { value: "weapon", label: "Vũ Khí" },
  { value: "armor", label: "Giáp" },
  { value: "hat", label: "Mũ" },
  { value: "belt", label: "Đai Lưng" },
  { value: "boots", label: "Giày" },
  { value: "accessory", label: "Phụ Kiện" },
  { value: "pill", label: "Đan Dược" },
  { value: "herb", label: "Thảo Dược" },
  { value: "ore", label: "Nguyên Liệu" },
  { value: "misc", label: "Khác" },
];

export const CHAT_CHANNELS = [
  { value: "world", label: "Thế Giới" },
  { value: "sect", label: "Tông Môn" },
  { value: "private", label: "Riêng Tư" },
];

export const LEADERBOARD_TABS = [
  { value: "power", label: "Lực Chiến" },
  { value: "realm", label: "Cảnh Giới" },
  { value: "pvp", label: "PvP" },
];

export const MISSION_TYPE_TABS = [
  { value: "", label: "Tất cả" },
  { value: "main", label: "Chính Tuyến" },
  { value: "realm", label: "Cảnh Giới" },
  { value: "sect", label: "Tông Môn" },
  { value: "npc", label: "Phụ Tuyến" },
  { value: "grind", label: "Cày Lặp" },
];

export const EQUIP_SLOT_LABELS: Record<string, string> = {
  weapon: "Vũ Khí",
  armor: "Giáp Thân",
  hat: "Đầu",
  belt: "Đai Lưng",
  boots: "Giày",
  accessory: "Phụ Kiện",
};
