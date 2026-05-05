import { useOnlinePlayers } from "@/lib/hooks";
import { ELEMENT_NAMES, ELEMENT_COLORS } from "@/lib/constants";

export default function OnlinePage() {
  const { data: players, isLoading } = useOnlinePlayers();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-amber-500 font-bold tracking-widest text-lg">TRỰC TUYẾN</h1>
        {players && <span className="text-xs text-emerald-600 border border-emerald-900 rounded-sm px-2 py-0.5">{players.length} đạo hữu</span>}
      </div>

      {isLoading ? (
        <div className="text-amber-800 text-center py-16">Đang quét tiên giới...</div>
      ) : !players?.length ? (
        <div className="text-amber-800 text-center py-16">Hư không tịch lặng, chưa có ai trực tuyến.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((p: any) => {
            const elColor = p.primaryElement ? ELEMENT_COLORS[p.primaryElement] : "#94a3b8";
            return (
              <div key={p.id} className="bg-[#120e08] border border-amber-900/20 rounded-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center font-bold"
                    style={{ borderColor: elColor, color: elColor, background: elColor + "11" }}>
                    {p.name[0]}
                  </div>
                  <div>
                    <div className="text-amber-300 font-medium">{p.name}</div>
                    <div className="text-xs text-amber-800">{p.realmName}</div>
                  </div>
                  {p.cultivating && (
                    <span className="ml-auto text-xs text-emerald-600 border border-emerald-900 rounded-sm px-1.5 py-0.5 animate-pulse">NĐ</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: elColor }}>
                    {p.primaryElement ? ELEMENT_NAMES[p.primaryElement] : "—"} Căn
                  </span>
                  <span className="text-amber-800">Lực: {p.power.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
