import { toast } from "sonner";
import { useCharacter, useRealms, useBreakthrough, useStartCultivation, useStopCultivation } from "@/lib/hooks";
import { PageSpinner, Card, CardLabel, ProgressBar, Btn } from "@/components/ui";

export default function CultivationPage() {
  const { data: char, isLoading } = useCharacter({ refetchInterval: 5000 });
  const { data: realms } = useRealms();
  const breakthrough = useBreakthrough();
  const startCult = useStartCultivation();
  const stopCult  = useStopCultivation();

  if (isLoading) return <PageSpinner label="ĐANG TẢI CẢNH GIỚI..." />;
  if (!char) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="text-3xl opacity-20">☯</div>
      <p className="text-amber-800 text-sm">Không có nhân vật.</p>
    </div>
  );

  const expPct        = Math.min(100, (char.exp / char.expRequired) * 100);
  const canBreakthrough = char.exp >= char.expRequired;
  const currentIndex  = realms ? realms.findIndex((r: any) => r.key === char.realmKey) : -1;

  async function handleBreakthrough() {
    try {
      const res = await breakthrough.mutateAsync();
      if ((res as any).success) toast.success((res as any).message);
      else toast.error((res as any).message);
    } catch (err: any) { toast.error(err.message || "Đột phá thất bại"); }
  }

  async function toggleCultivation() {
    try {
      if (char.cultivating) {
        await stopCult.mutateAsync();
        toast.success("Xuất định.");
      } else {
        await startCult.mutateAsync();
        toast.success("Bắt đầu nhập định...");
      }
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-amber-700">☯</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Tu Luyện Cảnh Giới</h1>
        </div>
        <p className="text-amber-900 text-xs mt-1 ml-5">Nhập định tích lũy tu vi, đủ điều kiện thì đột phá lên cảnh giới cao hơn.</p>
      </div>

      {/* Current realm card */}
      <Card className="p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 className="text-amber-300 font-bold text-xl">{char.realmName}</h2>
              {char.cultivating && (
                <span className="text-xs text-emerald-500 border border-emerald-800/40 rounded-sm px-2 py-0.5 animate-pulse">Đang Nhập Định</span>
              )}
            </div>
            <div className="text-amber-800 text-xs tabular-nums">{char.exp.toLocaleString()} / {char.expRequired.toLocaleString()} Tu Vi</div>
          </div>
          <div className="flex gap-2">
            <Btn
              variant={char.cultivating ? "red" : "green"}
              onClick={toggleCultivation}
              loading={startCult.isPending || stopCult.isPending}
              className="px-4 py-2"
            >
              {char.cultivating ? "XUẤT ĐỊNH" : "NHẬP ĐỊNH"}
            </Btn>
            <Btn
              variant={canBreakthrough ? "gold" : "ghost"}
              onClick={handleBreakthrough}
              disabled={!canBreakthrough}
              loading={breakthrough.isPending}
              className={`px-4 py-2 ${canBreakthrough ? "animate-pulse" : ""}`}
            >
              {breakthrough.isPending ? "ĐANG ĐỘT PHÁ..." : "ĐỘT PHÁ"}
            </Btn>
          </div>
        </div>

        <ProgressBar
          pct={expPct}
          color={char.cultivating ? "#f59e0b" : "#92400e"}
          bg="#1c0a00"
          height="h-4"
          glow={char.cultivating}
          animated={char.cultivating}
        />
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-amber-900">
            {canBreakthrough
              ? <span className="text-amber-400 font-medium animate-pulse">✦ Tu vi đã đủ — có thể đột phá!</span>
              : `Cần thêm ${(char.expRequired - char.exp).toLocaleString()} Tu Vi`}
          </span>
          <span className="text-amber-800 tabular-nums">{expPct.toFixed(1)}%</span>
        </div>

        {/* EXP bonus info */}
        <div className="mt-3 pt-3 border-t border-amber-900/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { label: "Tu luyện", rate: "+/giờ tự động" },
            { label: "Boss",     rate: "EXP +500~2000" },
            { label: "Bí Cảnh",  rate: "EXP +200~1200" },
            { label: "Nhiệm Vụ", rate: "EXP +150~800" },
          ].map(s => (
            <div key={s.label} className="bg-[#0f0c06] border border-amber-900/15 rounded-sm p-2">
              <div className="text-amber-800 text-xs">{s.label}</div>
              <div className="text-amber-700 text-xs mt-0.5">{s.rate}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Realm progression list */}
      <CardLabel>Đường Tu Tiên (21 cảnh giới)</CardLabel>
      <div className="space-y-1.5 mt-3">
        {realms?.map((realm: any, i: number) => {
          const isCurrent = realm.key === char.realmKey;
          const isPast    = i < currentIndex;
          const isFuture  = i > currentIndex;
          return (
            <div
              key={realm.key}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm border transition-all ${
                isCurrent ? "bg-amber-900/15 border-amber-600/40 shadow-[0_0_12px_#c9a84c1a]"
                : isPast  ? "bg-[#0c0903] border-amber-900/10 opacity-55"
                :           "bg-[#120e08] border-amber-900/15 hover:border-amber-900/30"
              }`}
            >
              {/* Step indicator */}
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 font-medium ${
                isCurrent ? "border-amber-500 text-amber-400 bg-amber-900/30"
                : isPast  ? "border-emerald-800 text-emerald-700 bg-emerald-950/30"
                :           "border-amber-900/25 text-amber-900"
              }`}>
                {isPast ? "✓" : i + 1}
              </div>

              {/* Name + desc */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isCurrent ? "text-amber-300" : isPast ? "text-amber-700" : "text-amber-800"}`}>
                  {realm.name}
                  {isCurrent && <span className="ml-2 text-xs text-amber-600 font-normal">← Hiện tại</span>}
                </div>
                <div className="text-xs text-amber-900 truncate">{realm.description}</div>
              </div>

              {/* Cost */}
              <div className="text-right flex-shrink-0">
                <div className={`text-xs tabular-nums ${isCurrent ? "text-amber-600" : "text-amber-900"}`}>
                  {realm.expCost.toLocaleString()} Tu Vi
                </div>
                {realm.stages > 1 && (
                  <div className="text-xs text-amber-900">{realm.stages} trọng</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
