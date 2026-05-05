import { useState } from "react";
import { useLeaderboard } from "@/lib/hooks";
import { ELEMENT_NAMES, ELEMENT_COLORS, LEADERBOARD_TABS } from "@/lib/constants";
import { PageSpinner, EmptyState, TabBar } from "@/components/ui";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_ICON   = ["★", "⬡", "△"];

export default function LeaderboardPage() {
  const [type, setType] = useState("power");
  const { data: entries, isLoading } = useLeaderboard(type);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-amber-700">▲</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Bảng Xếp Hạng</h1>
        </div>
      </div>

      <TabBar tabs={LEADERBOARD_TABS} value={type} onChange={setType} />

      {isLoading ? (
        <PageSpinner label="ĐANG TẢI XẾP HẠNG..." />
      ) : !entries?.length ? (
        <EmptyState icon="▲" title="Chưa có dữ liệu xếp hạng." sub="Hãy tu luyện để leo lên bảng xếp hạng!" />
      ) : (
        <div className="space-y-2">
          {entries.map((e: any, idx: number) => {
            const rankColor = e.rank <= 3 ? RANK_COLORS[e.rank - 1] : "#4b3a1a";
            const rankIcon  = e.rank <= 3 ? RANK_ICON[e.rank - 1] : String(e.rank);
            const elColor   = e.primaryElement ? ELEMENT_COLORS[e.primaryElement] : "#6b5a2a";
            const isTop3    = e.rank <= 3;

            return (
              <div
                key={e.characterId}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-sm border transition-all ${
                  e.rank === 1 ? "bg-amber-900/10 border-amber-600/40 shadow-[0_0_16px_#FFD70015]" :
                  isTop3 ? "bg-[#120e08] border-amber-800/30" :
                  "bg-[#120e08] border-amber-900/20 hover:border-amber-900/35"
                }`}
              >
                {/* Rank badge */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border"
                  style={{ color: rankColor, borderColor: rankColor + "55", background: rankColor + "11" }}
                >
                  {rankIcon}
                </div>

                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ borderColor: elColor + "66", color: elColor, background: elColor + "11" }}
                >
                  {e.name?.[0] ?? "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${isTop3 ? "text-amber-300" : "text-amber-500"}`}>{e.name}</span>
                    {e.title && (
                      <span className="text-xs text-purple-800 border border-purple-900/30 rounded-sm px-1.5 py-0 leading-5">「{e.title}」</span>
                    )}
                    {e.primaryElement && (
                      <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ color: elColor, background: elColor + "11" }}>
                        {ELEMENT_NAMES[e.primaryElement] || e.primaryElement}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-amber-800">{e.realmName}</div>
                  {e.sectName && <div className="text-xs text-amber-900">{e.sectName}</div>}
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold tabular-nums ${isTop3 ? "text-amber-300" : "text-amber-600"}`}>
                    {type === "pvp"
                      ? `${e.pvpWins ?? 0} W`
                      : (e.power ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-amber-900">
                    {type === "realm" ? "Cảnh giới" : type === "pvp" ? "PvP thắng" : "Lực chiến"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
