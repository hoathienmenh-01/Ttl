import { useState } from "react";
import { toast } from "sonner";
import { useAlchemyRecipes, useCraftAlchemy, useInventory, useCharacter } from "@/lib/hooks";
import { PageSpinner, EmptyState, Card, CardLabel } from "@/components/ui";

const REALM_NAMES: Record<string, string> = {
  phamnhan: "Phàm Nhân", luyenkhi: "Luyện Khí", trucco: "Trúc Cơ",
  kimdan: "Kim Đan", nguyenanh: "Nguyên Anh",
};
const REALM_ORDER: Record<string, number> = {
  phamnhan: 1, luyenkhi: 2, trucco: 3, kimdan: 4, nguyenanh: 5,
};

export default function AlchemyPage() {
  const { data: recipes = [], isLoading } = useAlchemyRecipes();
  const { data: char } = useCharacter();
  const { data: inventory = [] } = useInventory();
  const craft = useCraftAlchemy();
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const [craftingId, setCraftingId] = useState<string | null>(null);

  const invMap = new Map<string, number>();
  for (const item of (inventory as any[])) {
    invMap.set(item.templateId, (invMap.get(item.templateId) ?? 0) + item.qty);
  }

  function canCraft(recipe: any): boolean {
    if (!char) return false;
    if (recipe.requiredRealm && (REALM_ORDER[char.realmKey] ?? 0) < (REALM_ORDER[recipe.requiredRealm] ?? 0)) return false;
    if (char.linhThach < recipe.linhThachCost) return false;
    for (const inp of recipe.inputItems) {
      if ((invMap.get(inp.itemId) ?? 0) < inp.qty) return false;
    }
    return true;
  }

  function isRealmLocked(recipe: any): boolean {
    return !!recipe.requiredRealm && (REALM_ORDER[char?.realmKey ?? ""] ?? 0) < (REALM_ORDER[recipe.requiredRealm] ?? 0);
  }

  async function handleCraft(recipeId: string) {
    setCraftingId(recipeId);
    setLastResult(null);
    try {
      const r = await craft.mutateAsync(recipeId) as any;
      setLastResult({ success: r.success, message: r.message });
      if (r.success) {
        toast.success(r.message);
        if (r.newlyEarned?.length) setTimeout(() => {
          for (const n of r.newlyEarned) toast.success(`Thành tựu mới: ${n}!`);
        }, 500);
        if (r.completedMissions?.length) setTimeout(() => {
          for (const n of r.completedMissions) toast.success(`Nhiệm vụ hoàn thành: ${n}!`);
        }, 900);
      } else {
        toast.error(r.message);
      }
    } catch (e: any) {
      toast.error(e?.data?.error || e.message || "Luyện đan thất bại");
    } finally {
      setCraftingId(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-700">⊛</span>
            <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">Luyện Đan Phòng</h1>
          </div>
          <p className="text-amber-900 text-xs mt-1 ml-5">Chọn công thức và nguyên liệu để luyện đan. Tỷ lệ thành công phụ thuộc vào công thức.</p>
        </div>
        {char && (
          <div className="text-right flex-shrink-0">
            <div className="text-amber-500 font-bold tabular-nums">{char.linhThach.toLocaleString()}</div>
            <div className="text-amber-900 text-xs">Linh Thạch</div>
          </div>
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`mb-5 px-4 py-3 rounded-sm border text-sm flex items-center gap-2 ${
          lastResult.success
            ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400"
            : "border-red-800/40 bg-red-950/20 text-red-400"
        }`}>
          <span className="text-base flex-shrink-0">{lastResult.success ? "✓" : "✗"}</span>
          <span>{lastResult.message}</span>
          <button onClick={() => setLastResult(null)} className="ml-auto text-xs opacity-50 hover:opacity-80">✕</button>
        </div>
      )}

      {isLoading ? (
        <PageSpinner label="ĐANG TẢI CÔNG THỨC..." />
      ) : !(recipes as any[]).length ? (
        <EmptyState icon="⊛" title="Chưa có công thức luyện đan nào." sub="Mở khóa thêm công thức qua nhiệm vụ và tu luyện." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(recipes as any[]).map(recipe => {
            const craftable   = canCraft(recipe);
            const lsOk        = (char?.linhThach ?? 0) >= recipe.linhThachCost;
            const realmLocked = isRealmLocked(recipe);
            const successPct  = Math.round(recipe.successRate * 100);
            const isThisCraft = craftingId === recipe.id;
            const missingItems = recipe.inputItems.filter((inp: any) => (invMap.get(inp.itemId) ?? 0) < inp.qty);

            return (
              <Card
                key={recipe.id}
                className={`p-5 transition-all ${
                  craftable ? "border-amber-700/35 hover:border-amber-600/50" : "border-amber-900/15 opacity-65"
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-amber-300 font-medium mb-0.5">{recipe.name}</h3>
                    <p className="text-amber-900 text-xs leading-relaxed">{recipe.description}</p>
                  </div>
                  {/* Success rate */}
                  <div className={`flex-shrink-0 text-center px-2.5 py-1.5 border rounded-sm ${
                    successPct >= 90 ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400" :
                    successPct >= 70 ? "border-amber-700/40 bg-amber-900/15 text-amber-400" :
                    "border-red-800/40 bg-red-950/20 text-red-400"
                  }`}>
                    <div className="text-base font-bold leading-none">{successPct}%</div>
                    <div className="text-xs opacity-70 mt-0.5">thành công</div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mb-4">
                  <CardLabel>Nguyên liệu</CardLabel>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {recipe.inputItems.map((inp: any) => {
                      const have = invMap.get(inp.itemId) ?? 0;
                      const ok   = have >= inp.qty;
                      return (
                        <div key={inp.itemId} className={`text-xs px-2 py-1 rounded-sm border flex items-center gap-1 ${
                          ok ? "border-amber-800/30 text-amber-700 bg-amber-950/20" : "border-red-900/40 text-red-800 bg-red-950/20"
                        }`}>
                          <span>{inp.itemName} ×{inp.qty}</span>
                          <span className={`font-medium ${ok ? "text-amber-600" : "text-red-700"}`}>({have})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Output + cost */}
                <div className="flex items-center justify-between mb-4 py-2.5 px-3 border border-amber-900/15 rounded-sm bg-[#0f0c06]">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-900 text-xs">Tạo ra:</span>
                    <span className="text-cyan-400 text-xs font-medium">{recipe.outputItem.itemName} ×{recipe.outputItem.qty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {recipe.requiredRealm && (
                      <span className={`${realmLocked ? "text-red-700 border-red-900/50" : "text-amber-900 border-amber-950/60"} border px-1.5 py-0.5 rounded-sm`}>
                        {REALM_NAMES[recipe.requiredRealm] ?? recipe.requiredRealm}+
                      </span>
                    )}
                    <span className={`font-medium ${lsOk ? "text-amber-700" : "text-red-700"}`}>
                      -{recipe.linhThachCost} LS
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCraft(recipe.id)}
                  disabled={!craftable || craft.isPending}
                  className={`w-full py-2.5 text-xs font-medium tracking-wider rounded-sm border transition-all ${
                    craftable && !isThisCraft
                      ? "bg-amber-900/20 border-amber-700/40 text-amber-400 hover:bg-amber-900/35 hover:border-amber-600"
                      : "bg-[#0f0c06] border-amber-950/30 text-amber-900 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {isThisCraft ? "ĐANG LUYỆN ĐAN..." : craftable ? "LUYỆN ĐAN" : realmLocked ? "Chưa Đủ Cảnh Giới" : missingItems.length ? "Thiếu Nguyên Liệu" : !lsOk ? "Thiếu Linh Thạch" : "Không Thể Luyện"}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
