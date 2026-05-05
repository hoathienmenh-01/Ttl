import { useBattlePass, useClaimBattlePassTier } from "@/lib/hooks";
import { toast } from "sonner";
import { PageSpinner, EmptyState, ProgressBar, CardLabel } from "@/components/ui";

const ITEM_NAMES: Record<string, string> = {
  hoi_khi_dan: "Hồi Khí Đan", khai_tam_dan: "Khai Tâm Đan", truc_co_dan: "Trúc Cơ Đan",
  linh_thao: "Linh Thảo", truc_diep: "Trúc Diệp",
};
const TITLE_COLORS: Record<string, string> = {
  "Tu Sĩ Nhập Môn": "#22c55e", "Hoa Thiên Đệ Tử": "#38bdf8", "Thiên Tông Tinh Anh": "#a855f7",
  "Đạo Nhân": "#22c55e", "Thiên Tài Tu Sĩ": "#38bdf8", "Truyền Thuyết": "#f59e0b",
};
const PASS_XP_SOURCES = [
  { action: "Chinh phục bí cảnh",     xp: 50, icon: "⚔" },
  { action: "Hoàn thành nhiệm vụ",    xp: 30, icon: "✦" },
  { action: "Tấn công Boss Thế Giới", xp: 20, icon: "☠" },
];

export default function BattlePassPage() {
  const { data, isLoading, refetch } = useBattlePass();
  const claim = useClaimBattlePassTier();

  if (isLoading) return <PageSpinner label="ĐANG TẢI BATTLE PASS..." />;
  if (!data?.season) return (
    <EmptyState icon="◆" title="Không có mùa Battle Pass đang hoạt động." sub="Hãy quay lại sau." />
  );

  const { season, progress } = data;
  const passXp: number         = progress?.passXp ?? 0;
  const claimedTiers: number[] = progress?.claimedTiers ?? [];
  const tiers: any[]           = (season.tiers as any[]) ?? [];
  const totalXp                = tiers[tiers.length - 1]?.xpRequired ?? 3200;
  const passPct                = Math.min(100, (passXp / totalXp) * 100);

  const endDate  = new Date(season.endDate);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000));

  const claimable = tiers.filter(
    (t: any) => passXp >= t.xpRequired && !claimedTiers.includes(t.tier)
  ).length;

  async function handleClaim(tier: number) {
    try {
      const r = await claim.mutateAsync(tier);
      toast.success((r as any).message);
      refetch();
    } catch (e: any) {
      toast.error(e.data?.error || e.message || "Không thể nhận thưởng");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-600">◆</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Hành Đạo Lệnh</h1>
          <span className="ml-auto text-xs text-amber-700 border border-amber-800/40 rounded-sm px-2 py-0.5">
            Còn {daysLeft} ngày
          </span>
        </div>
        <p className="text-amber-700 text-xs ml-5">{season.name}</p>
      </div>

      {/* Claimable alert */}
      {claimable > 0 && (
        <div className="mb-4 px-4 py-2.5 border border-emerald-700/40 bg-emerald-950/20 rounded-sm flex items-center gap-2">
          <span className="text-emerald-500 animate-pulse">✦</span>
          <span className="text-emerald-400 text-xs">{claimable} phần thưởng đang chờ bạn nhận!</span>
        </div>
      )}

      {/* Pass XP bar */}
      <div className="bg-[#0f0c06] border border-amber-900/25 rounded-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <CardLabel>Hành Đạo Điểm</CardLabel>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{passXp.toLocaleString()} / {totalXp.toLocaleString()}</span>
        </div>
        <ProgressBar pct={passPct} color="#d97706" bg="#1c0a00" height="h-3" glow />
        <div className="flex justify-between text-xs text-amber-900 mt-1.5">
          <span>0 HĐĐ</span>
          <span>{passPct.toFixed(0)}% hoàn thành</span>
        </div>
      </div>

      {/* XP sources */}
      <div className="bg-[#0f0c06] border border-amber-900/20 rounded-sm p-3 mb-5">
        <CardLabel>Cách kiếm Hành Đạo Điểm</CardLabel>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {PASS_XP_SOURCES.map(s => (
            <div key={s.action} className="flex items-center gap-2 text-xs">
              <span className="text-amber-700 w-4 text-center flex-shrink-0">{s.icon}</span>
              <span className="text-amber-800 flex-1 leading-tight">{s.action}</span>
              <span className="text-amber-500 font-medium flex-shrink-0">+{s.xp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tiers */}
      <CardLabel>Các tầng thưởng ({tiers.length} Tier)</CardLabel>
      <div className="space-y-2 mt-3 mb-6">
        {tiers.map((tier: any) => {
          const claimed  = claimedTiers.includes(tier.tier);
          const unlocked = passXp >= tier.xpRequired;
          const canClaim = unlocked && !claimed;
          const tierPct  = tier.xpRequired > 0 ? Math.min(100, (passXp / tier.xpRequired) * 100) : 100;

          return (
            <div
              key={tier.tier}
              className={`flex items-center gap-3 p-3.5 rounded-sm border transition-all ${
                claimed   ? "border-amber-800/25 bg-amber-900/8" :
                canClaim  ? "border-amber-600/50 bg-amber-900/15 shadow-[0_0_8px_#c9a84c11]" :
                            "border-amber-900/15 bg-[#0f0c06]"
              }`}
            >
              {/* Tier badge */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                claimed   ? "border-amber-700/40 text-amber-600 bg-amber-950/40" :
                canClaim  ? "border-amber-500 text-amber-400 bg-amber-900/30" :
                            "border-amber-900/30 text-amber-900"
              }`}>
                {claimed ? "✓" : tier.tier}
              </div>

              {/* Rewards + XP progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {tier.linhThach > 0 && (
                    <span className={`text-xs font-medium ${claimed ? "text-amber-800" : "text-amber-400"}`}>
                      +{tier.linhThach.toLocaleString()} LS
                    </span>
                  )}
                  {tier.itemId && (
                    <span className={`text-xs ${claimed ? "text-emerald-900" : "text-emerald-500"}`}>
                      1× {ITEM_NAMES[tier.itemId] ?? tier.itemId}
                    </span>
                  )}
                  {tier.title && (
                    <span className="text-xs px-1.5 py-0.5 rounded-sm border border-purple-800/40"
                      style={{ color: TITLE_COLORS[tier.title] ?? "#a855f7" }}>
                      「{tier.title}」
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!unlocked && (
                    <div className="flex-1 max-w-[80px]">
                      <ProgressBar pct={tierPct} color="#92400e" bg="#1c0a00" height="h-1" />
                    </div>
                  )}
                  <span className={`text-xs ${unlocked ? "text-amber-700" : "text-amber-950"}`}>
                    {unlocked
                      ? `✓ ${tier.xpRequired.toLocaleString()} HĐĐ`
                      : `${tier.xpRequired.toLocaleString()} HĐĐ (còn ${(tier.xpRequired - passXp).toLocaleString()})`}
                  </span>
                </div>
              </div>

              {/* Claim button */}
              <button
                onClick={() => handleClaim(tier.tier)}
                disabled={!canClaim || claim.isPending}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-sm border transition-all ${
                  claimed   ? "border-amber-900/15 text-amber-900 cursor-default" :
                  canClaim  ? "border-amber-600 text-amber-400 hover:bg-amber-900/25 cursor-pointer" :
                              "border-amber-950 text-amber-950 cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {claimed ? "✓" : canClaim ? "Nhận" : "🔒"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Premium placeholder */}
      <div className="border border-purple-900/25 rounded-sm p-4 bg-purple-950/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-600 text-xs">◆</span>
          <span className="text-purple-500 text-xs font-medium tracking-widest">PASS CAO CẤP</span>
          <span className="text-purple-900 text-xs border border-purple-900/30 rounded-sm px-1.5 ml-auto">Sắp ra mắt</span>
        </div>
        <p className="text-purple-900 text-xs leading-relaxed mb-3">
          Pass Cao Cấp sẽ mở khóa phần thưởng mỹ quan đặc biệt và hiệu ứng tên hiệu độc quyền — không bán sức mạnh chiến đấu.
        </p>
        <div className="space-y-1.5">
          {["Khung tên hiệu độc quyền", "Hiệu ứng đột phá đặc biệt", "Huy hiệu avatar mùa"].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-purple-900">
              <span className="w-3 text-center">◎</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
