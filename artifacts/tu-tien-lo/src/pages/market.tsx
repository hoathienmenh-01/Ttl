import { useState } from "react";
import { toast } from "sonner";
import { useMarket, useBuyMarketItem } from "@/lib/hooks";
import { ITEM_TYPE_FILTER_TABS, QUALITY_LABELS, QUALITY_COLORS, QUALITY_GLOW } from "@/lib/constants";

export default function MarketPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const { data: listings, isLoading } = useMarket(typeFilter || undefined);
  const buy = useBuyMarketItem();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  async function handleBuy(id: string, name: string, price: number) {
    setBuyingId(id);
    try {
      await buy.mutateAsync(id);
      toast.success(`Đã mua ${name} với giá ${price.toLocaleString()} Linh Thạch.`);
    } catch (err: any) {
      toast.error(err.message || "Mua thất bại");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-amber-500 font-bold tracking-widest mb-6 text-lg">PHIÊN CHỢ</h1>

      <div className="flex flex-wrap gap-1 mb-6">
        {ITEM_TYPE_FILTER_TABS.map(t => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 text-xs tracking-wider rounded-sm border transition-all ${typeFilter === t.value ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-[#120e08] border-amber-900/20 text-amber-800 hover:border-amber-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-amber-800 text-center py-16">Đang tải phiên chợ...</div>
      ) : !listings?.length ? (
        <div className="text-amber-800 text-center py-16">
          <div className="text-4xl mb-4 opacity-20">⊕</div>
          <p>Phiên chợ vắng tanh, chưa có hàng hóa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {listings.map((l: any) => {
            const qColor = QUALITY_COLORS[l.quality] || "#94a3b8";
            return (
              <div key={l.id} className={`bg-[#120e08] border rounded-sm p-4 ${QUALITY_GLOW[l.quality] || ""}`} style={{ borderColor: qColor + "44" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium" style={{ color: qColor }}>{l.itemName}</div>
                    {l.enhanceLv > 0 && <div className="text-xs text-amber-600">+{l.enhanceLv}</div>}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-sm border flex-shrink-0" style={{ color: qColor, borderColor: qColor + "44", background: qColor + "11" }}>
                    {QUALITY_LABELS[l.quality] || l.quality}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mb-3 line-clamp-2">{l.description}</p>
                <div className="flex items-center justify-between mb-3 text-xs text-amber-800">
                  <span>Người bán: {l.sellerName}</span>
                  <span>x{l.qty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-amber-400 font-bold">{l.price.toLocaleString()} LS</div>
                  <button
                    onClick={() => handleBuy(l.id, l.itemName, l.price)}
                    disabled={buyingId === l.id || buy.isPending}
                    className="px-3 py-1.5 text-xs border border-emerald-900/40 text-emerald-700 hover:text-emerald-500 rounded-sm transition-all disabled:opacity-50"
                  >
                    {buyingId === l.id ? "Đang mua..." : "Mua"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
