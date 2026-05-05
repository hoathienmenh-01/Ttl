import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, apiPost, getToken } from "@/lib/api";
import { useCharacter, useRest } from "@/lib/hooks";
import { PageSpinner, EmptyState, Card, CardLabel, ProgressBar, Btn } from "@/components/ui";
import { ELEMENT_NAMES, ELEMENT_COLORS } from "@/lib/constants";

const REST_COOLDOWN_SECONDS = 120;
function useRestCooldown(lastRestAt: string | null | undefined): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!lastRestAt) { setRemaining(0); return; }
    function tick() {
      const elapsed = (Date.now() - new Date(lastRestAt!).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(REST_COOLDOWN_SECONDS - elapsed)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRestAt]);
  return remaining;
}

const DIFF_COLORS: Record<string, string>  = { easy: "text-emerald-600", medium: "text-amber-500", hard: "text-red-500" };
const DIFF_LABELS: Record<string, string>  = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const DIFF_BORDER: Record<string, string>  = { easy: "border-emerald-900/30", medium: "border-amber-900/30", hard: "border-red-900/30" };

async function get(path: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("Lỗi");
  return res.json();
}

function useDungeons() {
  return useQuery({ queryKey: ["dungeons"], queryFn: () => get("/dungeon") });
}
function useEnterDungeon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/dungeon/${id}/enter`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }),
  });
}

type CombatResult = {
  victory: boolean; logs: string[]; expGained: number; linhThachGained: number;
  hpRemaining: number; staminaRemaining: number; staminaCost: number;
  drops: string[]; elementMessage: string; message: string;
  newlyEarned?: string[]; completedMissions?: string[];
};

export default function DungeonPage() {
  const { data: dungeons, isLoading } = useDungeons();
  const { data: char } = useCharacter({ refetchInterval: 8000 });
  const enter = useEnterDungeon();
  const rest  = useRest();
  const restCooldown = useRestCooldown(char?.lastRestAt);
  const [result, setResult] = useState<CombatResult | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<string>("");

  const stamina    = char?.stamina ?? 0;
  const staminaMax = char?.staminaMax ?? 100;
  const staminaPct = Math.min(100, (stamina / staminaMax) * 100);

  async function handleEnter(id: string) {
    setActiveDungeon(id);
    setResult(null);
    try {
      const r = await enter.mutateAsync(id) as CombatResult;
      setResult(r);
      if (r.victory) {
        toast.success(r.message);
        if (r.newlyEarned?.length) setTimeout(() => {
          for (const n of r.newlyEarned!) toast.success(`Thành tựu mới: ${n}!`);
        }, 500);
        if (r.completedMissions?.length) setTimeout(() => {
          for (const n of r.completedMissions!) toast.success(`Nhiệm vụ hoàn thành: ${n}!`);
        }, 900);
      } else {
        toast.error(r.message);
      }
    } catch (e: any) {
      toast.error(e?.data?.error || e.message || "Không thể vào bí cảnh");
    } finally {
      setActiveDungeon("");
    }
  }

  async function handleRest() {
    try {
      const r = await rest.mutateAsync();
      toast.success((r as any).message);
    } catch (e: any) { toast.error(e.message || "Không thể nghỉ ngơi"); }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-amber-700">⚔</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Bí Cảnh</h1>
        </div>
        <p className="text-amber-900 text-xs mt-1 ml-5">
          Server tính toán toàn bộ chiến đấu. Ngũ hành tương khắc: +30% sát thương · bị khắc: -25%.
        </p>
      </div>

      {/* Stamina + rest bar */}
      {char && (
        <Card className="p-3 mb-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-amber-900">Thể Lực</span>
              <span className="text-blue-400 tabular-nums font-medium">{stamina} / {staminaMax}</span>
            </div>
            <ProgressBar pct={staminaPct} color="#3b82f6" bg="#0a1930" height="h-2.5" />
            <div className="text-xs text-amber-950 mt-1">Dễ -6 · Trung bình -10 · Khó -16 thể lực / lần</div>
          </div>
          <Btn
            variant="blue"
            onClick={handleRest}
            disabled={restCooldown > 0 || (char.hp >= char.hpMax && stamina >= staminaMax)}
            loading={rest.isPending}
            className="flex-shrink-0 px-3 py-2 whitespace-nowrap"
          >
            {rest.isPending ? "Đang nghỉ..." : restCooldown > 0 ? `CD ${restCooldown}s` : "Nghỉ Ngơi"}
          </Btn>
        </Card>
      )}

      {/* Element guide */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-5 px-3 py-2.5 border border-amber-900/15 rounded-sm bg-[#0f0c06]">
        <span className="text-amber-700 font-medium">Tương Khắc:</span>
        {[["Kim","Mộc"],["Mộc","Thổ"],["Thổ","Thủy"],["Thủy","Hỏa"],["Hỏa","Kim"]].map(([a,b]) => (
          <span key={a+b} className="text-amber-900">{a} → {b}</span>
        ))}
      </div>

      {/* Dungeon grid */}
      {isLoading ? (
        <PageSpinner label="TRINH SÁT BÍ CẢNH..." />
      ) : !dungeons?.length ? (
        <EmptyState icon="⚔" title="Chưa có bí cảnh nào được mở." sub="Hãy liên hệ quản trị viên." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dungeons.map((d: any) => {
            const elColor = d.element ? ELEMENT_COLORS[d.element] : "#78350f";
            const isActive = activeDungeon === d.id;
            const costMap: Record<string, number> = { easy: 6, medium: 10, hard: 16 };
            const cost  = d.staminaCost ?? costMap[d.difficulty] ?? 10;
            const hasStamina = !char || stamina >= cost;
            const diffBorder = DIFF_BORDER[d.difficulty] || "border-amber-900/25";

            return (
              <Card key={d.id} className={`p-5 hover:border-amber-800/40 transition-all ${diffBorder}`}>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {d.element && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: elColor, boxShadow: `0 0 5px ${elColor}` }} />
                      )}
                      <h3 className="text-amber-300 font-medium text-sm">{d.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {d.element && (
                        <span className="text-xs px-1.5 py-0.5 rounded-sm border" style={{ color: elColor, borderColor: elColor + "33", background: elColor + "0d" }}>
                          {ELEMENT_NAMES[d.element]}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${DIFF_COLORS[d.difficulty] || "text-amber-700"}`}>
                        {DIFF_LABELS[d.difficulty] || d.difficulty}
                      </span>
                      <span className="text-amber-900 text-xs">{d.stages} tầng</span>
                    </div>
                  </div>
                  {/* Rewards */}
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <div className="text-amber-600 text-xs font-medium">+{(d.expReward ?? 0).toLocaleString()} EXP</div>
                    <div className="text-amber-700 text-xs">+{(d.linhThachReward ?? 0).toLocaleString()} LS</div>
                    <div className="text-blue-800 text-xs">-{cost} TL</div>
                  </div>
                </div>

                <p className="text-xs text-amber-800 mb-4 leading-relaxed">{d.description}</p>

                {/* Monster info */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-amber-900">
                    <span className="text-amber-800">{d.monsterName}</span>
                    <span className="text-amber-950 ml-1">HP {(d.monsterHp ?? 0).toLocaleString()}</span>
                  </div>
                  <Btn
                    variant={hasStamina ? "gold" : "ghost"}
                    onClick={() => handleEnter(d.id)}
                    disabled={isActive || enter.isPending || !hasStamina}
                    loading={isActive}
                    className="px-4 py-2"
                  >
                    {isActive ? "Đang chiến..." : !hasStamina ? `Cần ${cost} TL` : "Vào Bí Cảnh"}
                  </Btn>
                </div>

                {/* Stamina shortage warning */}
                {!hasStamina && char && (
                  <div className="mt-2 text-xs text-red-800 border border-red-900/30 rounded-sm px-2 py-1.5 bg-red-950/20">
                    ⚠ Thể lực không đủ. Cần {cost}, hiện có {stamina}. Nhấn "Nghỉ Ngơi" để hồi phục.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Combat result panel */}
      {result && (
        <div className={`mt-6 border rounded-sm overflow-hidden ${result.victory ? "border-emerald-800/40" : "border-red-900/40"}`}>
          {/* Result banner */}
          <div className={`px-5 py-3 flex items-center justify-between ${result.victory ? "bg-emerald-950/40" : "bg-red-950/30"}`}>
            <div className={`font-bold text-sm tracking-wider ${result.victory ? "text-emerald-400" : "text-red-400"}`}>
              {result.victory ? "⚔ CHIẾN THẮNG" : "✖ BẠI TRẬN"}
            </div>
            <button onClick={() => setResult(null)} className="text-xs text-amber-900 hover:text-amber-700 transition-colors">✕ Đóng</button>
          </div>

          <div className="p-5 bg-[#0c0a06]">
            {/* Element message */}
            {result.elementMessage && (
              <div className="text-amber-700 text-xs italic mb-3 px-3 py-2 border border-amber-900/20 rounded-sm bg-amber-950/20">
                {result.elementMessage}
              </div>
            )}

            {/* Combat log */}
            <CardLabel>Nhật Ký Chiến Đấu</CardLabel>
            <div className="mt-2 mb-4 space-y-0.5 max-h-44 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-amber-950/20 [&::-webkit-scrollbar-thumb]:bg-amber-800/40">
              {result.logs?.map((l: string, i: number) => (
                <div key={i} className={`text-xs leading-relaxed ${
                  l.startsWith("★") || l.startsWith("⚔") ? "text-amber-500 font-medium" :
                  l.includes("CHIẾN THẮNG") || l.includes("thành công") ? "text-emerald-500" :
                  l.includes("bại") || l.includes("Bại") ? "text-red-500" :
                  "text-amber-800"
                }`}>
                  {l}
                </div>
              ))}
            </div>

            {/* Rewards summary */}
            <div className="border-t border-amber-900/20 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-amber-900 text-xs mb-0.5">EXP nhận</div>
                <div className="text-amber-400 font-bold tabular-nums">+{result.expGained.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-amber-900 text-xs mb-0.5">Linh Thạch</div>
                <div className="text-amber-500 font-bold tabular-nums">+{result.linhThachGained.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-amber-900 text-xs mb-0.5">Thể lực còn</div>
                <div className="text-blue-400 font-bold tabular-nums">{result.staminaRemaining}</div>
              </div>
              <div className="text-center">
                <div className="text-amber-900 text-xs mb-0.5">Vật phẩm</div>
                <div className={`font-bold text-sm ${result.drops?.length ? "text-emerald-400" : "text-amber-900"}`}>
                  {result.drops?.length ? result.drops.join(", ") : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
