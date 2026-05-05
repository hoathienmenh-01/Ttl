import { useEconomyLog } from "@/lib/hooks";
import { PageSpinner, EmptyState, ErrorState, CardLabel } from "@/components/ui";

const TYPE_META: Record<string, { label: string; color: string; sign: string; dot: string }> = {
  linh_thach_gain:  { label: "Linh Thạch +", color: "text-amber-400",  sign: "+", dot: "bg-amber-600" },
  linh_thach_spend: { label: "Linh Thạch -", color: "text-red-400",    sign: "-", dot: "bg-red-700" },
  exp_gain:         { label: "Tu Vi +",       color: "text-blue-400",   sign: "+", dot: "bg-blue-700" },
  item_grant:       { label: "Vật Phẩm",      color: "text-emerald-400",sign: "",  dot: "bg-emerald-700" },
};

const SOURCE_LABELS: Record<string, string> = {
  dungeon: "Bí Cảnh", mission: "Nhiệm Vụ", daily_login: "Điểm Danh",
  sell_item: "Bán Đồ", market_buy: "Phiên Chợ", boss: "Boss",
  battle_pass: "Battle Pass", sell: "Bán Đồ", alchemy: "Luyện Đan", topup: "Nạp Tiền",
  cultivation: "Tu Luyện", pvp: "PvP",
};

const SOURCE_COLOR: Record<string, string> = {
  dungeon: "border-red-900/30 text-red-900",
  boss: "border-orange-900/30 text-orange-900",
  mission: "border-amber-900/30 text-amber-900",
  daily_login: "border-amber-700/30 text-amber-700",
  battle_pass: "border-purple-900/30 text-purple-900",
  sell_item: "border-blue-900/30 text-blue-900",
  sell: "border-blue-900/30 text-blue-900",
  alchemy: "border-cyan-900/30 text-cyan-900",
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function EconomyLogPage() {
  const { data: logs, isLoading, isError } = useEconomyLog();

  if (isLoading) return <PageSpinner label="ĐANG TẢI LỊCH SỬ..." />;
  if (isError)   return <ErrorState message="Không thể tải lịch sử giao dịch." />;

  const entries: any[] = (logs as any[]) ?? [];

  // Group entries by date
  const grouped: Record<string, any[]> = {};
  for (const log of entries) {
    const key = formatDate(log.createdAt ?? new Date().toISOString());
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-amber-700">◎</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Lịch Sử Giao Dịch</h1>
        </div>
        <p className="text-amber-900 text-xs mt-1 ml-5">{entries.length} giao dịch gần nhất</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="◎"
          title="Chưa có giao dịch nào."
          sub="Vào bí cảnh, nhận nhiệm vụ hoặc điểm danh để bắt đầu."
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 border-t border-amber-900/15" />
                <CardLabel>{date}</CardLabel>
                <div className="flex-1 border-t border-amber-900/15" />
              </div>

              <div className="space-y-1">
                {dayLogs.map((log: any) => {
                  const meta        = log.meta ?? {};
                  const typeMeta    = TYPE_META[log.type] ?? { label: log.type, color: "text-amber-700", sign: "", dot: "bg-amber-900" };
                  const sourceLabel = SOURCE_LABELS[log.source] ?? log.source;
                  const sourceClass = SOURCE_COLOR[log.source] ?? "border-amber-900/20 text-amber-900";

                  let detail = "";
                  if (meta.dungeon)    detail = meta.dungeon as string;
                  else if (meta.mission) detail = meta.mission as string;
                  else if (meta.boss)    detail = meta.boss as string;
                  else if (meta.itemName) detail = meta.itemName as string;
                  else if (meta.streakDay) detail = `Ngày liên tục ${meta.streakDay}`;
                  else if (meta.tier)    detail = `Tier ${meta.tier}`;

                  const isGain  = typeMeta.sign === "+";
                  const isSpend = typeMeta.sign === "-";

                  return (
                    <div key={log.id}
                      className="flex items-center gap-3 px-3 py-2.5 border border-amber-900/12 rounded-sm bg-[#0f0c06] hover:border-amber-900/25 transition-all">
                      {/* Dot indicator */}
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeMeta.dot}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Amount */}
                          <span className={`text-xs font-medium ${typeMeta.color}`}>
                            {log.type !== "item_grant" ? (
                              <>{typeMeta.sign}{log.amount.toLocaleString()}{log.type.includes("exp") ? " EXP" : " LS"}</>
                            ) : (
                              <>{meta.itemName ?? `×${log.amount}`}</>
                            )}
                          </span>
                          {/* Source tag */}
                          <span className={`text-xs border rounded-sm px-1.5 py-0 leading-5 ${sourceClass}`}>
                            {sourceLabel}
                          </span>
                        </div>
                        {detail && <p className="text-xs text-amber-950 mt-0.5 truncate">{detail}</p>}
                      </div>

                      {/* Balance + time */}
                      <div className="flex-shrink-0 text-right">
                        {log.balanceAfter != null && (
                          <div className={`text-xs tabular-nums font-medium ${isGain ? "text-amber-600" : isSpend ? "text-amber-800" : "text-amber-900"}`}>
                            {log.balanceAfter.toLocaleString()} LS
                          </div>
                        )}
                        <div className="text-xs text-amber-950 tabular-nums">{formatTime(log.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
