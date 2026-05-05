import { useState } from "react";
import { toast } from "sonner";
import { useMissions, useAcceptMission, useCompleteMission } from "@/lib/hooks";
import { MISSION_TYPE_LABELS, MISSION_TYPE_TABS } from "@/lib/constants";
import { PageSpinner, EmptyState, ErrorState, Card, ProgressBar, RewardRow, TabBar } from "@/components/ui";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Có thể nhận",    color: "text-amber-600",  dot: "bg-amber-600" },
  accepted:  { label: "Đang thực hiện", color: "text-blue-500",   dot: "bg-blue-500" },
  completed: { label: "Sẵn nhận thưởng",color: "text-emerald-400",dot: "bg-emerald-400" },
  claimed:   { label: "Đã hoàn thành",  color: "text-amber-900",  dot: "bg-amber-900" },
  locked:    { label: "Chưa mở",        color: "text-amber-950",  dot: "bg-amber-950" },
};

const TYPE_BORDER: Record<string, string> = {
  main:  "border-l-amber-500",
  realm: "border-l-blue-700",
  sect:  "border-l-emerald-700",
  npc:   "border-l-purple-700",
  grind: "border-l-amber-800",
  event: "border-l-red-700",
};

export default function MissionPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const { data: missions, isLoading, isError } = useMissions();
  const accept   = useAcceptMission();
  const complete = useCompleteMission();

  const filtered = typeFilter ? missions?.filter((m: any) => m.type === typeFilter) : missions;

  async function handleAccept(id: string, name: string) {
    try {
      await accept.mutateAsync(id);
      toast.success(`Đã nhận nhiệm vụ: ${name}`);
    } catch (err: any) { toast.error(err.message || "Nhận nhiệm vụ thất bại"); }
  }

  async function handleComplete(id: string, name: string) {
    try {
      const res = await complete.mutateAsync(id);
      toast.success((res as any).message || `Hoàn thành: ${name}`);
    } catch (err: any) { toast.error(err.data?.error || err.message || "Hoàn thành thất bại"); }
  }

  const claimedCount   = missions?.filter((m: any) => m.status === "claimed").length ?? 0;
  const completedCount = missions?.filter((m: any) => ["accepted", "completed", "claimed"].includes(m.status)).length ?? 0;
  const total          = missions?.length ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-700">✦</span>
            <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Nhiệm Vụ</h1>
          </div>
          <p className="text-amber-900 text-xs mt-1 ml-5">Hoàn thành nhiệm vụ để nhận EXP, Linh Thạch và vật phẩm quý.</p>
        </div>
        {!isLoading && !isError && total > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="text-amber-600 text-sm font-bold">{claimedCount}/{total}</div>
            <div className="text-amber-900 text-xs">hoàn thành</div>
          </div>
        )}
      </div>

      <TabBar tabs={MISSION_TYPE_TABS} value={typeFilter} onChange={setTypeFilter} />

      {isLoading ? (
        <PageSpinner label="ĐANG TẢI NHIỆM VỤ..." />
      ) : isError ? (
        <ErrorState message="Không thể tải nhiệm vụ. Hãy thử lại sau." />
      ) : !filtered?.length ? (
        <EmptyState icon="✦" title="Không có nhiệm vụ nào." sub={typeFilter ? "Thử chọn loại nhiệm vụ khác." : ""} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m: any) => {
            const meta       = STATUS_META[m.status] ?? STATUS_META.available;
            const typeLabel  = MISSION_TYPE_LABELS[m.type] || m.type;
            const borderLeft = TYPE_BORDER[m.type] || "border-l-amber-900";
            const isClaimed  = m.status === "claimed";
            const progressPct = m.progressMax > 0 ? Math.min(100, (m.progress / m.progressMax) * 100) : 0;
            const progressDone = !m.objectiveType || m.progress >= m.progressMax;
            const canClaim   = (m.status === "completed" || progressDone) && m.status !== "claimed";

            return (
              <Card key={m.id}
                className={`border-l-4 ${borderLeft} transition-all ${isClaimed ? "opacity-40" : "hover:border-amber-800/40"}`}>
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Tags + status */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs text-amber-900 border border-amber-900/25 rounded-sm px-1.5 py-0.5 bg-amber-950/30">
                          {typeLabel}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          <span className={meta.color}>{meta.label}</span>
                        </span>
                        {m.type === "grind" && (
                          <span className="text-xs text-amber-900 border border-amber-900/20 rounded-sm px-1.5 py-0.5">Daily</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`font-medium mb-1 leading-snug ${isClaimed ? "text-amber-800" : "text-amber-300"}`}>
                        {m.name}
                      </h3>
                      {m.npcName && (
                        <p className="text-xs text-amber-800 mb-1">NPC: <span className="text-amber-700">{m.npcName}</span></p>
                      )}
                      <p className="text-xs text-amber-800 mb-3 leading-relaxed">{m.description}</p>

                      {/* Progress bar */}
                      {(m.objectiveType || m.progressMax > 1) && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-amber-900">Tiến độ</span>
                            <span className={progressDone ? "text-emerald-500 font-medium" : "text-amber-900 tabular-nums"}>
                              {m.progress}/{m.progressMax}
                              {progressDone ? " ✓" : ""}
                            </span>
                          </div>
                          <ProgressBar
                            pct={progressPct}
                            color={progressDone ? "#22c55e" : "#d97706"}
                            bg="#1c0a00"
                            height="h-1.5"
                          />
                        </div>
                      )}

                      <RewardRow exp={m.rewardExp} ls={m.rewardLinhThach} items={m.rewardItems?.length} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0 sm:flex-col">
                      {m.status === "available" && (
                        <button
                          onClick={() => handleAccept(m.id, m.name)}
                          disabled={accept.isPending}
                          className="px-4 py-2 text-xs border border-emerald-900/40 text-emerald-700 hover:text-emerald-500 hover:border-emerald-700/50 rounded-sm transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                          {accept.isPending ? "..." : "Nhận Nhiệm Vụ"}
                        </button>
                      )}
                      {(m.status === "accepted" || m.status === "completed") && (
                        <button
                          onClick={() => handleComplete(m.id, m.name)}
                          disabled={complete.isPending || !canClaim}
                          title={!canClaim ? `Tiến độ chưa đủ: ${m.progress}/${m.progressMax}` : ""}
                          className={`px-4 py-2 text-xs border rounded-sm transition-all whitespace-nowrap ${
                            canClaim
                              ? "border-amber-700/50 text-amber-400 hover:bg-amber-900/20 hover:border-amber-600 bg-amber-900/10"
                              : "border-amber-900/20 text-amber-900 cursor-not-allowed"
                          } disabled:opacity-40`}
                        >
                          {complete.isPending ? "..." : canClaim ? "Nhận Thưởng" : `${m.progress}/${m.progressMax}`}
                        </button>
                      )}
                      {m.status === "claimed" && (
                        <span className="px-4 py-2 text-xs text-amber-900 border border-amber-900/15 rounded-sm">✓ Xong</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
