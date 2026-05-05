import { toast } from "sonner";
import { useSects, useMySect, useJoinSect } from "@/lib/hooks";
import { PageSpinner, EmptyState, Card, CardLabel, StatPill } from "@/components/ui";

export default function SectPage() {
  const { data: sects, isLoading } = useSects();
  const { data: mySect }          = useMySect();
  const join = useJoinSect();

  async function handleJoin(sectId: string, name: string) {
    if (mySect) { toast.error("Đã gia nhập tông môn rồi. Hãy rời tông trước."); return; }
    try {
      await join.mutateAsync(sectId);
      toast.success(`Đã gia nhập ${name}!`);
    } catch (err: any) { toast.error(err.message || "Gia nhập thất bại"); }
  }

  const memberPct = mySect ? Math.min(100, (mySect.memberCount / mySect.maxMembers) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-amber-700">⊙</span>
          <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Tông Môn</h1>
        </div>
        <p className="text-amber-900 text-xs mt-1 ml-5">Gia nhập tông môn để nhận nhiệm vụ tông môn, kho tông và các phúc lợi thành viên.</p>
      </div>

      {/* My sect card */}
      {mySect && (
        <Card className="p-5 mb-6 border-amber-700/30 shadow-[0_0_20px_#c9a84c0d]">
          <div className="flex items-center gap-2 mb-3">
            <CardLabel>Tông Môn Của Tôi</CardLabel>
            <span className="text-xs text-amber-500 border border-amber-700/40 rounded-sm px-1.5 py-0.5 ml-auto">✓ Thành Viên</span>
          </div>
          <h2 className="text-amber-300 text-xl font-bold mb-1">{mySect.name}</h2>
          {mySect.description && (
            <p className="text-amber-800 text-sm mb-4 leading-relaxed">{mySect.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <StatPill label="Cấp Tông" value={mySect.level} />
            <StatPill label="Thành Viên" value={`${mySect.memberCount}/${mySect.maxMembers}`} />
            <StatPill label="Kho Tông" value={`${(mySect.treasuryLinhThach ?? 0).toLocaleString()} LS`} />
            <StatPill label="Chưởng Môn" value={mySect.leaderName || "—"} color="text-amber-200" />
          </div>
          {/* Member fill bar */}
          <div>
            <div className="flex justify-between text-xs text-amber-900 mb-1">
              <span>Thành viên</span>
              <span className="tabular-nums">{mySect.memberCount}/{mySect.maxMembers}</span>
            </div>
            <div className="h-1.5 bg-amber-950 rounded-full overflow-hidden">
              <div className="h-full bg-amber-700 transition-all" style={{ width: `${memberPct}%` }} />
            </div>
          </div>
        </Card>
      )}

      {/* Other sects */}
      <CardLabel>{mySect ? "Các Tông Môn Khác" : "Danh Sách Tông Môn"}</CardLabel>

      {isLoading ? (
        <PageSpinner label="ĐANG TẢI TÔNG MÔN..." />
      ) : !sects?.length ? (
        <EmptyState icon="⊙" title="Chưa có tông môn nào." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {(sects as any[]).map((s: any) => {
            const isMyS     = mySect?.id === s.id;
            const fillPct   = Math.min(100, (s.memberCount / (s.maxMembers || 1)) * 100);
            const isFull    = s.memberCount >= s.maxMembers;
            return (
              <Card key={s.id} className={`p-5 ${isMyS ? "border-amber-700/35" : "hover:border-amber-900/40"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-amber-300 font-medium">{s.name}</h3>
                    <div className="text-amber-900 text-xs mt-0.5">Cấp {s.level} · {s.leaderName ? `Chưởng Môn: ${s.leaderName}` : "Không có chưởng môn"}</div>
                  </div>
                  {isMyS && (
                    <span className="text-xs text-amber-500 border border-amber-800/40 rounded-sm px-1.5 py-0.5 flex-shrink-0">Của tôi</span>
                  )}
                  {isFull && !isMyS && (
                    <span className="text-xs text-red-800 border border-red-900/40 rounded-sm px-1.5 py-0.5 flex-shrink-0">Đầy</span>
                  )}
                </div>

                {s.description && (
                  <p className="text-amber-900 text-xs mb-3 leading-relaxed line-clamp-2">{s.description}</p>
                )}

                {/* Member bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-amber-900 mb-1">
                    <span>Thành viên</span>
                    <span className="tabular-nums">{s.memberCount}/{s.maxMembers}</span>
                  </div>
                  <div className="h-1.5 bg-amber-950 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${fillPct}%`, background: isFull ? "#92400e" : "#d97706" }} />
                  </div>
                </div>

                {!isMyS && (
                  <button
                    onClick={() => handleJoin(s.id, s.name)}
                    disabled={join.isPending || !!mySect || isFull}
                    className={`w-full py-2 text-xs border rounded-sm transition-all ${
                      !mySect && !isFull
                        ? "border-emerald-900/40 text-emerald-700 hover:text-emerald-500 hover:border-emerald-700/50"
                        : "border-amber-900/15 text-amber-900 cursor-not-allowed"
                    } disabled:opacity-40`}
                  >
                    {isFull ? "Tông Môn Đã Đầy" : mySect ? "Rời Tông Trước" : "Gia Nhập"}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
