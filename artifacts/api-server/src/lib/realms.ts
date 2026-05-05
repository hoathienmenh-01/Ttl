export interface RealmDef {
  key: string;
  name: string;
  tier: string;
  order: number;
  stages: number;
  expCost: number;
  description: string;
  realmMultiplier: number;
  baseExpPerTick: number;
}

export const REALMS: RealmDef[] = [
  { key: "phamnhan", name: "Phàm Nhân", tier: "phàm", order: 0, stages: 1, expCost: 500, description: "Người thường, chưa bước vào cõi tu tiên.", realmMultiplier: 1.0, baseExpPerTick: 5 },
  { key: "luyenkhi", name: "Luyện Khí", tier: "phàm", order: 1, stages: 9, expCost: 2000, description: "Hấp thu linh khí trời đất, mở căn cơ ban đầu.", realmMultiplier: 1.1, baseExpPerTick: 8 },
  { key: "trucco", name: "Trúc Cơ", tier: "phàm", order: 2, stages: 9, expCost: 10000, description: "Đặt nền móng tu tiên, ngưng tụ linh lực trong đan điền.", realmMultiplier: 1.2, baseExpPerTick: 15 },
  { key: "kimdan", name: "Kim Đan", tier: "phàm", order: 3, stages: 9, expCost: 50000, description: "Kết thành kim đan, linh lực tinh thuần.", realmMultiplier: 1.35, baseExpPerTick: 30 },
  { key: "nguyenanh", name: "Nguyên Anh", tier: "phàm", order: 4, stages: 9, expCost: 200000, description: "Nguyên anh xuất khiếu, thần thức mạnh mẽ.", realmMultiplier: 1.5, baseExpPerTick: 60 },
  { key: "hoathan", name: "Hóa Thần", tier: "phàm", order: 5, stages: 9, expCost: 800000, description: "Hóa thần nhập hư, siêu thoát thể xác phàm trần.", realmMultiplier: 1.7, baseExpPerTick: 100 },
  { key: "luyenhu", name: "Luyện Hư", tier: "phàm", order: 6, stages: 9, expCost: 3000000, description: "Luyện hư hợp đạo, nắm bắt quy tắc thiên địa.", realmMultiplier: 2.0, baseExpPerTick: 180 },
  { key: "hopthe", name: "Hợp Thể", tier: "phàm", order: 7, stages: 9, expCost: 10000000, description: "Hợp thể đại thừa, thân thể và linh hồn hòa làm một.", realmMultiplier: 2.4, baseExpPerTick: 300 },
  { key: "daitha", name: "Đại Thừa", tier: "phàm", order: 8, stages: 9, expCost: 40000000, description: "Đại thừa viên mãn, chuẩn bị vượt kiếp phi thăng.", realmMultiplier: 3.0, baseExpPerTick: 500 },
  { key: "dokiep", name: "Độ Kiếp", tier: "phàm", order: 9, stages: 9, expCost: 150000000, description: "Vượt thiên kiếp, tiến vào tiên đạo.", realmMultiplier: 3.8, baseExpPerTick: 800 },
  { key: "nhanhtien", name: "Nhân Tiên", tier: "nhân tiên", order: 10, stages: 1, expCost: 500000000, description: "Phi thăng tiên giới, thành Nhân Tiên.", realmMultiplier: 5.0, baseExpPerTick: 1200 },
  { key: "diatien", name: "Địa Tiên", tier: "nhân tiên", order: 11, stages: 1, expCost: 1500000000, description: "Địa Tiên nắm vận mệnh đất đai.", realmMultiplier: 6.5, baseExpPerTick: 2000 },
  { key: "thientien", name: "Thiên Tiên", tier: "nhân tiên", order: 12, stages: 1, expCost: 5000000000, description: "Thiên Tiên cai quản thiên đạo một phương.", realmMultiplier: 8.0, baseExpPerTick: 3000 },
  { key: "kimtien", name: "Kim Tiên", tier: "nhân tiên", order: 13, stages: 1, expCost: 15000000000, description: "Kim Tiên, bất tử trước thiên kiếp thường.", realmMultiplier: 10.0, baseExpPerTick: 5000 },
  { key: "dalakimtien", name: "Đại La Kim Tiên", tier: "nhân tiên", order: 14, stages: 1, expCost: 50000000000, description: "Đỉnh cao tiên giới, Đại La Kim Tiên.", realmMultiplier: 13.0, baseExpPerTick: 8000 },
  { key: "chuantthanh", name: "Chuẩn Thánh", tier: "hỗn nguyên", order: 15, stages: 1, expCost: 200000000000, description: "Bước vào ngưỡng cửa Thánh Nhân.", realmMultiplier: 17.0, baseExpPerTick: 12000 },
  { key: "thanhnthan", name: "Thánh Nhân", tier: "hỗn nguyên", order: 16, stages: 1, expCost: 800000000000, description: "Thánh Nhân lập đạo, bất diệt trước đại kiếp.", realmMultiplier: 22.0, baseExpPerTick: 20000 },
  { key: "daoquan", name: "Đạo Quân", tier: "hỗn nguyên", order: 17, stages: 1, expCost: 3000000000000, description: "Đạo Quân cai quản đạo vực, pháp tắc thành vũ khí.", realmMultiplier: 30.0, baseExpPerTick: 35000 },
  { key: "bannguyen", name: "Bản Nguyên", tier: "bản nguyên", order: 18, stages: 1, expCost: 10000000000000, description: "Bản Nguyên, nguồn gốc mọi sự vật hiện tượng.", realmMultiplier: 40.0, baseExpPerTick: 60000 },
  { key: "vinhhang", name: "Vĩnh Hằng", tier: "vĩnh hằng", order: 19, stages: 1, expCost: 50000000000000, description: "Vĩnh Hằng, siêu thoát sinh tử luân hồi.", realmMultiplier: 55.0, baseExpPerTick: 100000 },
  { key: "hukhongchton", name: "Hư Không Chí Tôn", tier: "vĩnh hằng", order: 20, stages: 1, expCost: 999999999999999, description: "Đỉnh tột cùng tu tiên. Nắm giữ hư không, vô địch thiên hạ.", realmMultiplier: 100.0, baseExpPerTick: 200000 },
];

export function getRealmByKey(key: string): RealmDef | undefined {
  return REALMS.find(r => r.key === key);
}

export function getRealmName(key: string, stage: number): string {
  const realm = getRealmByKey(key);
  if (!realm) return "Không rõ";
  if (realm.stages === 1) return realm.name;
  const stageNames = ["Nhất", "Nhị", "Tam", "Tứ", "Ngũ", "Lục", "Thất", "Bát", "Cửu"];
  return `${realm.name} ${stageNames[stage - 1] ?? "Nhất"} Trọng`;
}

export function getNextRealm(key: string, stage: number): { key: string; stage: number } | null {
  const realm = getRealmByKey(key);
  if (!realm) return null;
  if (stage < realm.stages) {
    return { key, stage: stage + 1 };
  }
  const nextRealm = REALMS.find(r => r.order === realm.order + 1);
  if (!nextRealm) return null;
  return { key: nextRealm.key, stage: 1 };
}

export function computePower(character: {
  power: number; spirit: number; speed: number; atk: number; def: number;
  hpMax: number; realmKey: string; realmStage: number;
}): number {
  const realm = getRealmByKey(character.realmKey);
  const multiplier = realm?.realmMultiplier ?? 1;
  const stats = character.atk * 1.0 + character.def * 0.7 + character.hpMax * 0.05 +
    character.speed * 0.8 + character.spirit * 0.5 + character.power * 1.2;
  return Math.round((stats + (realm?.order ?? 0) * 100) * multiplier);
}
