import { useState } from "react";
import { toast } from "sonner";
import { useInventory, useEquipItem, useUnequipItem, useUseItem, useSellItem, useCharacter } from "@/lib/hooks";
import { ITEM_TYPE_FILTER_TABS, QUALITY_COLORS, QUALITY_GLOW, ITEM_TYPE_LABELS, EQUIP_SLOT_LABELS } from "@/lib/constants";
import { PageSpinner, EmptyState, TabBar, QualityBadge } from "@/components/ui";

const EQUIP_SLOTS = ["weapon", "armor", "hat", "belt", "boots", "accessory"];
const USABLE = ["pill", "herb"];

const STAT_NAMES: Record<string, string> = {
  atk: "Công", def: "Thủ", spirit: "Thần Thức",
  speed: "Tốc", hp: "HP", mp: "MP", luck: "May", power: "Lực Chiến",
};

const STAT_KEYS_DISPLAY = ["atk", "def", "spirit", "speed", "hpMax", "mpMax", "luck", "power"] as const;
const STAT_LABEL: Record<string, string> = {
  atk: "Công Kích", def: "Phòng Thủ", spirit: "Thần Thức",
  speed: "Tốc Độ", hpMax: "HP Tối Đa", mpMax: "MP Tối Đa", luck: "May Mắn", power: "Lực Chiến",
};

function CharStatsBar({ char }: { char: any }) {
  if (!char) return null;
  const stats = [
    { key: "power",  label: "Lực Chiến", value: char.power, color: "#f59e0b" },
    { key: "atk",   label: "Công",       value: char.atk,   color: "#f97316" },
    { key: "def",   label: "Thủ",        value: char.def,   color: "#38bdf8" },
    { key: "spirit",label: "Thần Thức",  value: char.spirit,color: "#a855f7" },
    { key: "speed", label: "Tốc",        value: char.speed, color: "#22c55e" },
    { key: "luck",  label: "May",        value: char.luck,  color: "#fbbf24" },
  ];
  return (
    <div className="mb-4 p-3 border border-amber-900/20 rounded-sm bg-[#0d0a05]">
      <div className="text-amber-900 text-xs tracking-widest mb-2">CHỈ SỐ NHÂN VẬT HIỆN TẠI</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {stats.map(s => (
          <span key={s.key} className="flex items-center gap-1 text-xs">
            <span className="text-amber-800">{s.label}</span>
            <span className="font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs">
          <span className="text-amber-800">HP</span>
          <span className="font-mono text-rose-400">{char.hp}<span className="text-amber-900">/{char.hpMax}</span></span>
        </span>
        <span className="flex items-center gap-1 text-xs">
          <span className="text-amber-800">MP</span>
          <span className="font-mono text-sky-400">{char.mp}<span className="text-amber-900">/{char.mpMax}</span></span>
        </span>
      </div>
    </div>
  );
}

function EquipmentPanel({ equippedItems }: { equippedItems: any[] }) {
  const slotMap: Record<string, any> = {};
  equippedItems.forEach(i => { slotMap[i.slot || i.type] = i; });

  return (
    <div className="mb-4 p-3 border border-emerald-900/30 rounded-sm bg-emerald-950/10">
      <div className="text-emerald-800 text-xs tracking-widest mb-2">ĐANG TRANG BỊ</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {Object.entries(EQUIP_SLOT_LABELS).map(([slot, label]) => {
          const item = slotMap[slot];
          const qColor = item ? (QUALITY_COLORS[item.quality] || "#94a3b8") : "#3a2e1a";
          return (
            <div key={slot} className="flex items-center gap-2 px-2 py-1.5 rounded-sm border text-xs"
              style={{ borderColor: item ? qColor + "44" : "#3a2e1a", background: item ? qColor + "0d" : "transparent" }}>
              <span className="text-amber-900 w-14 shrink-0">{label}</span>
              {item ? (
                <span className="font-medium truncate" style={{ color: qColor }}>{item.name}</span>
              ) : (
                <span className="text-amber-950 italic">Trống</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [confirmSell, setConfirmSell] = useState<any>(null);
  const { data: items, isLoading } = useInventory(typeFilter || undefined);
  const { data: char } = useCharacter();
  const equip   = useEquipItem();
  const unequip = useUnequipItem();
  const use     = useUseItem();
  const sell    = useSellItem();

  async function handleAction(action: string, item: any) {
    try {
      if (action === "equip") {
        const r: any = await equip.mutateAsync(item.id);
        toast.success(`Đã trang bị ${item.name}.${r.newPower ? ` Lực chiến: ${r.newPower}` : ""}`);
      }
      if (action === "unequip") {
        const r: any = await unequip.mutateAsync(item.id);
        toast.success(`Đã tháo ${item.name}.${r.newPower ? ` Lực chiến: ${r.newPower}` : ""}`);
      }
      if (action === "use") {
        const r: any = await use.mutateAsync(item.id);
        toast.success(r.effectsSummary ? `${item.name}: ${r.effectsSummary}` : (r.message || `Đã dùng ${item.name}.`));
      }
      if (action === "sell") {
        const r: any = await sell.mutateAsync({ id: item.id, qty: 1 });
        toast.success(r.message || `Đã bán ${item.name}.`);
        setConfirmSell(null);
      }
    } catch (err: any) {
      toast.error(err.data?.error || err.message || "Thao tác thất bại");
      setConfirmSell(null);
    }
  }

  const equippedItems = items?.filter((i: any) => i.equipped) ?? [];
  const showEquipPanel = !typeFilter && equippedItems.length > 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-700">⊞</span>
            <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Kho Đồ</h1>
          </div>
          {!isLoading && items?.length != null && (
            <p className="text-amber-900 text-xs mt-1 ml-5">{items.length} vật phẩm · {equippedItems.length} đang trang bị</p>
          )}
        </div>
      </div>

      {/* Character stats bar */}
      <CharStatsBar char={char} />

      {/* Equipment panel */}
      {showEquipPanel && <EquipmentPanel equippedItems={equippedItems} />}

      <TabBar tabs={ITEM_TYPE_FILTER_TABS} value={typeFilter} onChange={setTypeFilter} />

      {isLoading ? (
        <PageSpinner label="ĐANG TẢI KHO ĐỒ..." />
      ) : !items?.length ? (
        <EmptyState icon="⊞" title="Kho đồ trống rỗng như hư không." sub="Vào bí cảnh, đánh boss hoặc làm nhiệm vụ để nhận vật phẩm." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {items.map((item: any) => {
            const qColor = QUALITY_COLORS[item.quality] || "#94a3b8";
            const glowClass = QUALITY_GLOW[item.quality] || "";
            const isEquipped = item.equipped;
            const isEquipSlot = EQUIP_SLOTS.includes(item.type);
            const isUsable   = USABLE.includes(item.type);
            const hasStats   = item.baseStats && Object.keys(item.baseStats).length > 0;

            return (
              <div
                key={item.id}
                className={`bg-[#120e08] border rounded-sm p-4 flex flex-col transition-all hover:border-opacity-60 ${glowClass} ${isEquipped ? "border-opacity-70" : "border-opacity-30"}`}
                style={{ borderColor: qColor + (isEquipped ? "77" : "44") }}
              >
                {/* Item header */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-tight mb-0.5" style={{ color: qColor }}>{item.name}</div>
                    <div className="text-xs text-amber-900">{ITEM_TYPE_LABELS[item.type] || item.type}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isEquipped && (
                      <span className="text-xs text-emerald-500 border border-emerald-800/50 rounded-sm px-1.5 py-0.5 font-medium">Đang Đeo</span>
                    )}
                    <QualityBadge quality={item.quality} />
                    {item.qty > 1 && (
                      <span className="text-xs text-amber-700 font-bold">×{item.qty}</span>
                    )}
                  </div>
                </div>

                {item.enhanceLv > 0 && (
                  <div className="text-xs text-amber-500 mb-1.5 font-medium">+{item.enhanceLv} Cường Hóa</div>
                )}

                <p className="text-xs text-amber-800 mb-3 leading-relaxed line-clamp-2 flex-grow">{item.description}</p>

                {/* Stats */}
                {hasStats && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(item.baseStats as Record<string, number>).map(([k, v]) => (
                      <span key={k} className="text-xs px-1.5 py-0.5 rounded-sm bg-amber-900/15 border border-amber-900/20 text-amber-600">
                        {STAT_NAMES[k] || k} +{String(v)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sell price */}
                <div className="text-xs text-amber-950 mb-2">Bán: {item.sellPrice} LS</div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-wrap">
                  {isEquipSlot && (
                    isEquipped
                      ? <button
                          onClick={() => handleAction("unequip", item)}
                          disabled={unequip.isPending}
                          className="text-xs px-2.5 py-1.5 border border-red-900/40 text-red-700 hover:text-red-500 hover:border-red-800/60 rounded-sm transition-all disabled:opacity-40">
                          Tháo Ra
                        </button>
                      : <button
                          onClick={() => handleAction("equip", item)}
                          disabled={equip.isPending}
                          className="text-xs px-2.5 py-1.5 border border-amber-700/40 text-amber-600 hover:text-amber-400 hover:border-amber-600/60 rounded-sm transition-all disabled:opacity-40">
                          Trang Bị
                        </button>
                  )}
                  {isUsable && (
                    <button
                      onClick={() => handleAction("use", item)}
                      disabled={use.isPending}
                      className="text-xs px-2.5 py-1.5 border border-emerald-900/40 text-emerald-700 hover:text-emerald-500 hover:border-emerald-700/50 rounded-sm transition-all disabled:opacity-40">
                      Sử Dụng
                    </button>
                  )}
                  {/* Item cannot be sold while equipped */}
                  {isEquipped ? (
                    <span className="text-xs px-2 py-1.5 text-amber-950 cursor-not-allowed select-none" title="Tháo ra trước khi bán">Bán</span>
                  ) : (
                    <button
                      onClick={() => setConfirmSell(item)}
                      disabled={sell.isPending}
                      className="text-xs px-2.5 py-1.5 border border-amber-900/20 text-amber-900 hover:text-amber-700 hover:border-amber-800/40 rounded-sm transition-all disabled:opacity-40">
                      Bán
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sell confirmation modal */}
      {confirmSell && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setConfirmSell(null)}>
          <div className="bg-[#120e08] border border-amber-900/40 rounded-sm p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-amber-400 font-bold tracking-widest mb-2 text-sm">XÁC NHẬN BÁN</h3>
            <p className="text-amber-700 text-sm mb-1">
              Bán <span className="font-medium" style={{ color: QUALITY_COLORS[confirmSell.quality] || "#c9a84c" }}>{confirmSell.name}</span>?
            </p>
            <p className="text-amber-500 text-xs mb-1">Nhận lại: <span className="font-bold">{confirmSell.sellPrice} Linh Thạch</span></p>
            <p className="text-amber-900 text-xs mb-5">Không thể hoàn tác sau khi bán.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAction("sell", confirmSell)}
                disabled={sell.isPending}
                className="flex-1 py-2 bg-amber-900/25 border border-amber-700/40 text-amber-400 text-sm rounded-sm hover:bg-amber-900/40 transition-all disabled:opacity-40">
                {sell.isPending ? "Đang bán..." : "Xác Nhận Bán"}
              </button>
              <button
                onClick={() => setConfirmSell(null)}
                className="flex-1 py-2 border border-amber-900/20 text-amber-800 text-sm rounded-sm hover:border-amber-800/40 transition-all">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
