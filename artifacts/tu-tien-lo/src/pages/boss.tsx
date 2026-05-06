import { useState } from "react";
import { toast } from "sonner";
import { useBosses, useAttackBoss } from "@/lib/hooks";
import { ELEMENT_NAMES, ELEMENT_COLORS } from "@/lib/constants";
import { PageSpinner, EmptyState, Card, CardLabel, ProgressBar, TabBar } from "@/components/ui";

const ZONE_LABELS: Record<string, string> = {
  thanh_khe:       "Thanh Khê Cốc",
  co_quang_mo:     "Cổ Quặng Mỏ",
  hoa_nguyen_quan: "Hỏa Nguyên Quan",
  loi_nguyen_dinh: "Lôi Nguyên Đỉnh",
  tuyet_bang_dinh: "Tuyết Băng Đỉnh",
};

interface CombatLog {
  logs: string[]; expGained: number; linhThachGained: number;
  bossKilled: boolean; drops: string[]; message?: string;
  playerDmg?: number; bossDmg?: number;
  skillUsed?: { id: string; name: string; mpCost?: number; mpConsumed?: number; cooldownRounds?: number; log?: string | null } | null;
  mpRemaining?: number;
}

export default function BossPage() {
  const { data: bosses, isLoading, refetch } = useBosses();
  const attack = useAttackBoss();
  const [combatLog, setCombatLog]   = useState<CombatLog | null>(null);
  const [attackingId, setAttackingId] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter]   = useState("");

  const zones   = bosses ? [...new Set((bosses as any[]).map((b: any) => b.zone))] : [];
  const filtered = zoneFilter ? bosses?.filter((b: any) => b.zone === zoneFilter) : bosses;

  const zoneTabs = [
    { value: "", label: "Tất cả" },
    ...zones.map((z: any) => ({ value: z, label: ZONE_LABELS[z] || z })),
  ];

  async function handleAttack(bossId: string) {
    setAttackingId(bossId);
    try {
      const res = await attack.mutateAsync(bossId) as CombatLog & any;
      setCombatLog(res);
      if (res.bossKilled) {
        toast.success(res.message || "Boss đã bị tiêu diệt!");
        if (res.newlyEarned?.length) setTimeout(() => {
          for (const n of res.newlyEarned) toast.success(`Thành tựu mới: ${n}!`);
        }, 500);
        if (res.completedMissions?.length) setTimeout(() => {
          for (const n of res.completedMissions) toast.success(`Nhiệm vụ hoàn thành: ${n}!`);
        }, 900);
        refetch();
      } else {
        toast.info(res.message || "Boss vẫn còn sống.");
      }
    } catch (err: any) {
      toast.error(err.data?.error || err.message || "Tấn công thất bại");
    } finally {
      setAttackingId(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-red-800">☠</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Boss Thế Giới</h1>
        </div>
        <p className="text-amber-900 text-xs mt-1 ml-5">
          Boss chia sẻ HP với tất cả người chơi. Cùng nhau tiêu diệt để nhận phần thưởng lớn.
        </p>
      </div>

      <TabBar tabs={zoneTabs} value={zoneFilter} onChange={setZoneFilter} />

      {isLoading ? (
        <PageSpinner label="TRINH SÁT CHIẾN TRƯỜNG..." />
      ) : !filtered?.length ? (
        <EmptyState icon="☠" title="Không có boss nào trong khu vực này." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(filtered as any[]).map((boss: any) => {
            const hpPct  = Math.min(100, (boss.hpCurrent / boss.hpMax) * 100);
            const elColor = ELEMENT_COLORS[boss.element ?? ""] || "#94a3b8";
            const isDead  = boss.hpCurrent <= 0;

            return (
              <Card key={boss.id}
                className={`p-5 transition-all ${
                  boss.isWorldBoss ? "border-amber-600/40 shadow-[0_0_16px_#c9a84c1a]" :
                  isDead ? "opacity-40 border-amber-900/10" :
                  "hover:border-amber-800/40"
                }`}>
                {/* World boss badge */}
                {boss.isWorldBoss && (
                  <div className="text-xs text-amber-500 border border-amber-700/30 rounded-sm px-2 py-0.5 inline-flex items-center gap-1 mb-2 tracking-widest bg-amber-900/10">
                    <span>★</span> THẾ GIỚI BOSS
                  </div>
                )}

                {isDead && (
                  <div className="text-xs text-emerald-800 border border-emerald-900/30 rounded-sm px-2 py-0.5 inline-block mb-2 bg-emerald-950/20">
                    ✓ Đã tiêu diệt — đang hồi sinh
                  </div>
                )}

                <h3 className="text-amber-300 font-bold text-base mb-1.5">{boss.name}</h3>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {boss.element && (
                    <span className="text-xs px-1.5 py-0.5 rounded-sm border"
                      style={{ color: elColor, borderColor: elColor + "44", background: elColor + "11" }}>
                      {ELEMENT_NAMES[boss.element] || boss.element}
                    </span>
                  )}
                  <span className="text-xs text-amber-900">{ZONE_LABELS[boss.zone] || boss.zone}</span>
                  <span className="text-xs text-amber-900">Lực {boss.power?.toLocaleString()}</span>
                </div>

                <p className="text-xs text-amber-800 mb-4 leading-relaxed line-clamp-2">{boss.description}</p>

                {/* HP bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-amber-900">HP Toàn Thế Giới</span>
                    <span className="text-red-500 tabular-nums font-medium">
                      {boss.hpCurrent.toLocaleString()} / {boss.hpMax.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar pct={hpPct} color={hpPct > 50 ? "#ef4444" : hpPct > 25 ? "#f97316" : "#fbbf24"} bg="#3b0000" height="h-3" />
                  <div className="text-xs text-amber-950 mt-1 tabular-nums">{hpPct.toFixed(1)}% còn lại</div>
                </div>

                {/* Rewards preview */}
                <div className="flex gap-3 text-xs text-amber-900 mb-4">
                  <span>+EXP {boss.expReward?.toLocaleString?.() ?? "?"}</span>
                  <span>+{boss.linhThachReward?.toLocaleString?.() ?? "?"} LS</span>
                  {boss.minRealm && <span>Yêu cầu: {boss.minRealm}</span>}
                </div>

                <button
                  onClick={() => handleAttack(boss.id)}
                  disabled={attackingId === boss.id || attack.isPending || isDead}
                  className={`w-full py-2.5 text-sm tracking-wider rounded-sm border transition-all font-medium ${
                    isDead ? "border-amber-900/10 text-amber-950 cursor-not-allowed" :
                    attackingId === boss.id ? "border-red-800/40 text-red-600 bg-red-950/20 animate-pulse" :
                    "border-red-800/40 text-red-400 hover:bg-red-900/20 bg-red-950/10"
                  } disabled:opacity-50`}
                >
                  {isDead ? "Đã Tiêu Diệt" : attackingId === boss.id ? "ĐANG TẤN CÔNG..." : "TẤN CÔNG"}
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Combat result modal */}
      {combatLog && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setCombatLog(null)}>
          <div className="bg-[#0f0c06] border border-amber-900/40 rounded-sm p-6 max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className={`flex items-center justify-between mb-4 pb-3 border-b border-amber-900/20`}>
              <h3 className={`font-bold tracking-widest text-sm ${combatLog.bossKilled ? "text-emerald-400" : "text-amber-500"}`}>
                {combatLog.bossKilled ? "★ BOSS BỊ TIÊU DIỆT!" : "⚔ KẾT QUẢ CHIẾN ĐẤU"}
              </h3>
              <button onClick={() => setCombatLog(null)} className="text-amber-900 hover:text-amber-700 text-lg leading-none transition-colors">✕</button>
            </div>

            {/* Combat log */}
            {combatLog.skillUsed && (
              <div className="mb-3 rounded-sm border border-blue-900/30 bg-blue-950/10 px-3 py-2 text-xs text-blue-300">
                <div className="font-medium text-blue-200 mb-1">Pháp thuật đã dùng</div>
                <div>
                  {combatLog.skillUsed.name} · -{combatLog.skillUsed.mpConsumed ?? combatLog.skillUsed.mpCost ?? 0} MP
                  {combatLog.skillUsed.cooldownRounds ? ` · CD ${combatLog.skillUsed.cooldownRounds} lượt` : ""}
                </div>
                {typeof combatLog.mpRemaining === "number" && <div className="text-blue-500 mt-1">MP còn lại: {combatLog.mpRemaining}</div>}
              </div>
            )}
            <div className="flex-1 overflow-y-auto mb-4 space-y-0.5 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-amber-950/20 [&::-webkit-scrollbar-thumb]:bg-amber-800/40">
              {combatLog.logs.map((log, i) => (
                <p key={i} className={`text-xs leading-relaxed ${
                  i === 0 ? "text-amber-600 font-medium" :
                  combatLog.bossKilled && i === combatLog.logs.length - 1 ? "text-emerald-400" :
                  log.includes("bị") || log.includes("Bại") ? "text-red-700" :
                  "text-amber-800"
                }`}>{log}</p>
              ))}
            </div>

            {/* Rewards */}
            <div className="border-t border-amber-900/20 pt-4 grid grid-cols-2 gap-3 mb-4">
              <div className="text-center bg-[#120e08] border border-amber-900/15 rounded-sm p-2">
                <div className="text-amber-900 text-xs mb-0.5">EXP nhận</div>
                <div className="text-amber-400 font-bold tabular-nums">+{combatLog.expGained.toLocaleString()}</div>
              </div>
              <div className="text-center bg-[#120e08] border border-amber-900/15 rounded-sm p-2">
                <div className="text-amber-900 text-xs mb-0.5">Linh Thạch</div>
                <div className="text-amber-500 font-bold tabular-nums">+{combatLog.linhThachGained.toLocaleString()}</div>
              </div>
            </div>
            {combatLog.drops.length > 0 && (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-sm px-3 py-2 mb-4 text-xs">
                <span className="text-emerald-700 font-medium">Vật phẩm rơi: </span>
                <span className="text-emerald-500">{combatLog.drops.join(", ")}</span>
              </div>
            )}

            <button onClick={() => setCombatLog(null)}
              className="w-full py-2.5 bg-amber-900/20 border border-amber-900/40 text-amber-600 text-sm rounded-sm hover:bg-amber-900/30 transition-all">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
