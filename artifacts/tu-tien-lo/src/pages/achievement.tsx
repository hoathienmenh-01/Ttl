import { useState } from "react";
import { toast } from "sonner";
import { useAchievements, useClaimAchievement } from "@/lib/hooks";
import { PageSpinner, ProgressBar } from "@/components/ui";

const CATEGORY_LABELS: Record<string, string> = {
  combat: "Chiến Đấu", cultivation: "Tu Luyện", social: "Nhiệm Vụ",
  skill: "Pháp Thuật", alchemy: "Luyện Đan", misc: "Khác",
};
const CATEGORY_COLORS: Record<string, string> = {
  combat: "#ef4444", cultivation: "#f59e0b", social: "#10b981",
  skill: "#8b5cf6", alchemy: "#06b6d4", misc: "#6b7280",
};

export default function AchievementPage() {
  const { data, isLoading, refetch } = useAchievements();
  const claim = useClaimAchievement();
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  async function handleClaim(id: string, name: string) {
    try {
      const r = await claim.mutateAsync(id) as any;
      toast.success(r.message || `Nhận thưởng "${name}" thành công!`);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Thất bại");
    }
  }

  if (isLoading) return <PageSpinner label="ĐANG TẢI THÀNH TỰU..." />;

  const achievements: any[] = data?.achievements ?? [];
  const earned    = achievements.filter(a => a.status !== "locked");
  const locked    = achievements.filter(a => a.status === "locked");
  const claimable = achievements.filter(a => a.status === "earned");
  const pct       = achievements.length ? (earned.length / achievements.length) * 100 : 0;
  const categories = [...new Set(achievements.map(a => a.category))];

  function applyFilter(items: any[]) {
    if (filter === "earned") return items.filter(a => a.status !== "locked");
    if (filter === "locked") return items.filter(a => a.status === "locked");
    return items;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-700">◆</span>
            <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Thành Tựu</h1>
          </div>
          <p className="text-amber-900 text-xs mt-1 ml-5">
            {earned.length}/{achievements.length} đạt được
            {claimable.length > 0 && (
              <span className="ml-2 text-emerald-600 animate-pulse">· {claimable.length} chờ nhận thưởng</span>
            )}
          </p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-5 bg-[#120e08] border border-amber-900/20 rounded-sm p-3">
        <div className="flex justify-between text-xs text-amber-800 mb-2">
          <span>Tiến độ tổng thể</span>
          <span className="tabular-nums font-medium text-amber-600">{pct.toFixed(1)}%</span>
        </div>
        <ProgressBar pct={pct} color="#d97706" bg="#1c0a00" height="h-2.5" />
        <div className="flex gap-3 mt-2 text-xs">
          <span className="text-amber-700">{earned.length} đạt được</span>
          <span className="text-amber-900">·</span>
          <span className="text-amber-900">{locked.length} chưa mở</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-5">
        {(["all", "earned", "locked"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs tracking-wider rounded-sm border transition-all ${
              filter === f ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-[#0f0c06] border-amber-900/20 text-amber-800 hover:border-amber-800/60"
            }`}>
            {f === "all" ? "Tất cả" : f === "earned" ? "Đã đạt" : "Chưa mở"}
          </button>
        ))}
      </div>

      {/* Categories */}
      {categories.map(cat => {
        const items = applyFilter(achievements.filter(a => a.category === cat));
        if (!items.length) return null;
        const color = CATEGORY_COLORS[cat] ?? "#6b7280";
        const catEarned = items.filter(a => a.status !== "locked").length;
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1.5 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
              <h2 className="text-xs tracking-widest font-medium" style={{ color }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <span className="text-amber-900 text-xs">{catEarned}/{items.length}</span>
              <div className="flex-1 border-t border-amber-900/15" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {items.map((a: any) => {
                const isEarned  = a.status !== "locked";
                const isClaimed = a.status === "claimed";
                const canClaim  = a.status === "earned";
                return (
                  <div key={a.id}
                    className={`bg-[#120e08] border rounded-sm p-4 flex items-start gap-3 transition-all ${
                      canClaim ? "border-amber-600/40 shadow-[0_0_8px_#c9a84c11]" :
                      isEarned ? "border-amber-800/30" :
                      "border-amber-900/15 opacity-50"
                    }`}>
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0 w-8 text-center leading-none mt-0.5"
                      style={{ color: isEarned ? color : "#374151", filter: isEarned ? "none" : "grayscale(1)" }}>
                      {a.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm mb-0.5 ${isEarned ? "text-amber-300" : "text-amber-900"}`}>
                        {a.name}
                      </div>
                      <div className="text-amber-900 text-xs leading-relaxed">{a.description}</div>

                      {/* Rewards */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {a.rewardLinhThach > 0 && (
                          <span className="text-xs text-amber-700 border border-amber-900/25 rounded-sm px-1.5 py-0.5">
                            +{a.rewardLinhThach} LS
                          </span>
                        )}
                        {a.rewardTitle && (
                          <span className="text-xs text-purple-700 border border-purple-900/40 px-1.5 py-0.5 rounded-sm">
                            「{a.rewardTitle}」
                          </span>
                        )}
                      </div>

                      {isEarned && a.earnedAt && (
                        <div className="text-amber-950 text-xs mt-1.5">
                          {new Date(a.earnedAt).toLocaleDateString("vi-VN")} · {isClaimed ? "Đã nhận" : canClaim ? <span className="text-emerald-700">Chưa nhận thưởng</span> : ""}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 ml-1">
                      {canClaim ? (
                        <button
                          onClick={() => handleClaim(a.id, a.name)}
                          disabled={claim.isPending}
                          className="px-2.5 py-1.5 text-xs bg-amber-900/25 border border-amber-700/50 text-amber-400 rounded-sm hover:bg-amber-900/40 transition-all disabled:opacity-50"
                        >
                          Nhận
                        </button>
                      ) : isClaimed ? (
                        <span className="text-emerald-800 text-sm">✓</span>
                      ) : (
                        <span className="text-amber-950 text-sm">?</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
