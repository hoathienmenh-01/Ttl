import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, apiPost, getToken } from "@/lib/api";

const ELEMENT_COLORS: Record<string, string> = {
  kim: "#d4af37", moc: "#4ade80", thuy: "#60a5fa", hoa: "#f97316",
  tho: "#a16207", loi: "#a855f7", bang: "#67e8f9", am: "#6b7280",
};
const ELEMENT_NAMES: Record<string, string> = {
  kim: "Kim", moc: "Mộc", thuy: "Thủy", hoa: "Hỏa",
  tho: "Thổ", loi: "Lôi", bang: "Băng", am: "Âm",
};
const TYPE_LABELS: Record<string, string> = { attack: "Công kích", heal: "Hồi phục", defense: "Phòng thủ", utility: "Hỗ trợ" };
const TYPE_COLORS: Record<string, string> = { attack: "text-red-500", heal: "text-emerald-500", defense: "text-blue-400", utility: "text-amber-400" };

async function get(path: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("Lỗi");
  return res.json();
}
function useCatalog() { return useQuery({ queryKey: ["skill-catalog"], queryFn: () => get("/skill/catalog") }); }
function useMineSkills() { return useQuery({ queryKey: ["skill-mine"], queryFn: () => get("/skill/mine") }); }
function useLearnSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => apiPost(`/skill/${skillId}/learn`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-mine"] }); qc.invalidateQueries({ queryKey: ["character"] }); },
  });
}

export default function SkillPage() {
  const [tab, setTab] = useState<"catalog" | "mine">("catalog");
  const [elementFilter, setElementFilter] = useState("");
  const { data: catalog, isLoading: catalogLoading } = useCatalog();
  const { data: mine, isLoading: mineLoading } = useMineSkills();
  const learn = useLearnSkill();

  const learnedIds = new Set((mine ?? []).map((s: any) => s.skillId));

  const filtered = elementFilter
    ? catalog?.filter((s: any) => s.element === elementFilter)
    : catalog;

  async function handleLearn(skillId: string, name: string) {
    try {
      const r = await learn.mutateAsync(skillId);
      toast.success(r.message || `Đã học ${name}`);
    } catch (e: any) { toast.error(e.message || "Học pháp thuật thất bại"); }
  }

  const elements = ["", "kim", "moc", "thuy", "hoa", "tho", "loi", "bang"];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-amber-500 font-bold tracking-widest mb-2 text-lg">PHÁP THUẬT</h1>
      <p className="text-amber-800 text-xs mb-6">Học pháp thuật để tăng cường chiến lực. Mỗi pháp thuật mang hệ ngũ hành riêng. Tốn 500 Linh Thạch/pháp.</p>

      <div className="flex gap-1 mb-4">
        <button onClick={() => setTab("catalog")} className={`px-4 py-2 text-xs tracking-wider rounded-sm border transition-all ${tab === "catalog" ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-[#120e08] border-amber-900/20 text-amber-800"}`}>Danh Mục</button>
        <button onClick={() => setTab("mine")} className={`px-4 py-2 text-xs tracking-wider rounded-sm border transition-all ${tab === "mine" ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-[#120e08] border-amber-900/20 text-amber-800"}`}>Đã Học ({mine?.length ?? 0})</button>
      </div>

      {tab === "catalog" && (
        <>
          <div className="flex flex-wrap gap-1 mb-4">
            {elements.map(el => (
              <button key={el} onClick={() => setElementFilter(el)}
                className={`px-2 py-1 text-xs rounded-sm border transition-all ${elementFilter === el ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-[#120e08] border-amber-900/20 text-amber-800"}`}
                style={el && elementFilter === el ? { borderColor: `${ELEMENT_COLORS[el]}60`, color: ELEMENT_COLORS[el] } : {}}>
                {el ? ELEMENT_NAMES[el] : "Tất cả"}
              </button>
            ))}
          </div>
          {catalogLoading ? (
            <div className="text-amber-800 text-center py-16 animate-pulse">Đang tải pháp thuật...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered?.map((s: any) => {
                const elColor = ELEMENT_COLORS[s.element] ?? "#78350f";
                const learned = learnedIds.has(s.id);
                return (
                  <div key={s.id} className={`bg-[#120e08] border rounded-sm p-4 transition-all ${learned ? "border-amber-600/30" : "border-amber-900/20"}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold"
                          style={{ borderColor: elColor, color: elColor, background: `${elColor}15` }}>
                          {s.name[0]}
                        </div>
                        <div>
                          <div className="text-amber-300 font-medium text-sm">{s.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs" style={{ color: elColor }}>{ELEMENT_NAMES[s.element]}</span>
                            <span className={`text-xs ${TYPE_COLORS[s.type] || "text-amber-800"}`}>• {TYPE_LABELS[s.type] || s.type}</span>
                          </div>
                        </div>
                      </div>
                      {learned && <span className="text-xs text-amber-600 border border-amber-800/40 rounded-sm px-1.5 py-0.5 flex-shrink-0">Đã học</span>}
                    </div>
                    <p className="text-xs text-amber-800 mb-3">{s.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs mb-3">
                      <span className="text-amber-700">MP: {s.mpCost}</span>
                      {s.damageMultiplier > 1 && <span className="text-red-700">x{s.damageMultiplier} sát thương</span>}
                      {s.healMultiplier > 0 && <span className="text-emerald-700">x{s.healMultiplier} hồi phục</span>}
                      <span className="text-amber-900">CD: {s.cooldownSeconds}s</span>
                    </div>
                    {!learned && (
                      <button onClick={() => handleLearn(s.id, s.name)} disabled={learn.isPending}
                        className="w-full py-2 text-xs border border-amber-900/40 text-amber-700 hover:text-amber-500 hover:border-amber-700/40 rounded-sm transition-all disabled:opacity-50">
                        Học (500 Linh Thạch)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "mine" && (
        <>
          {mineLoading ? (
            <div className="text-amber-800 text-center py-16 animate-pulse">Đang tải...</div>
          ) : !mine?.length ? (
            <div className="text-amber-800 text-center py-16">
              <div className="text-2xl mb-2">☯</div>
              <div>Chưa học được pháp thuật nào.</div>
              <div className="text-xs mt-1">Vào Danh Mục để học pháp thuật đầu tiên.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mine.map((s: any) => {
                const elColor = ELEMENT_COLORS[s.element] ?? "#78350f";
                return (
                  <div key={s.id} className="bg-[#120e08] border border-amber-600/25 rounded-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold"
                        style={{ borderColor: elColor, color: elColor, background: `${elColor}15` }}>
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="text-amber-300 font-medium text-sm">{s.name}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: elColor }}>{ELEMENT_NAMES[s.element]}</span>
                          <span className={`text-xs ${TYPE_COLORS[s.type] || ""}`}>• {TYPE_LABELS[s.type] || s.type}</span>
                        </div>
                      </div>
                      <div className="ml-auto text-xs text-amber-700 border border-amber-800/30 rounded-sm px-1.5 py-0.5">Lv.{s.level}</div>
                    </div>
                    <p className="text-xs text-amber-800 mb-2">{s.description}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-amber-700">MP: {s.mpCost}</span>
                      {s.damageMultiplier > 1 && <span className="text-red-700">x{s.damageMultiplier}</span>}
                      {s.healMultiplier > 0 && <span className="text-emerald-700">x{s.healMultiplier} hồi</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
