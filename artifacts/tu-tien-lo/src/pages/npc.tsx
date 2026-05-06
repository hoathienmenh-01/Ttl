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
const ROLE_LABELS: Record<string, string> = {
  quest_giver: "Phát nhiệm vụ", tutorial_npc: "Hướng dẫn", rival_npc: "Đối thủ",
  lore_npc: "Lore bí ẩn", sect_npc: "Chấp Sự", board_npc: "Bảng nhiệm vụ",
};

async function get(path: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("Lỗi tải dữ liệu");
  return res.json();
}

function useNpcs() {
  return useQuery({ queryKey: ["npcs"], queryFn: () => get("/npc") });
}
function useNpcQuests(npcId: string) {
  return useQuery({ queryKey: ["npc-quests", npcId], queryFn: () => get(`/npc/${npcId}/quests`), enabled: !!npcId });
}
function useNpcAffinity(npcId: string) {
  return useQuery({ queryKey: ["npc-affinity", npcId], queryFn: () => get(`/npc/${npcId}/affinity`), enabled: !!npcId });
}
function useTalkNpc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (npcId: string) => apiPost(`/npc/${npcId}/talk`),
    onSuccess: (_data, npcId) => qc.invalidateQueries({ queryKey: ["npc-affinity", npcId] }),
  });
}
function useAcceptMission() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiPost(`/mission/${id}/accept`), onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }) });
}
function useCompleteMission() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiPost(`/mission/${id}/complete`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["missions"] }); qc.invalidateQueries({ queryKey: ["character"] }); } });
}

const STATUS_LABELS: Record<string, string> = { available: "Có thể nhận", accepted: "Đang làm", completed: "Hoàn thành", claimed: "Đã nhận thưởng" };
const STATUS_COLORS: Record<string, string> = { available: "text-amber-500", accepted: "text-emerald-500", completed: "text-blue-400", claimed: "text-amber-900" };

export default function NpcPage() {
  const { data: npcs, isLoading } = useNpcs();
  const [selectedNpc, setSelectedNpc] = useState<any>(null);
  const { data: quests, isLoading: questsLoading } = useNpcQuests(selectedNpc?.id ?? "");
  const { data: affinity } = useNpcAffinity(selectedNpc?.id ?? "");
  const talk = useTalkNpc();
  const accept = useAcceptMission();
  const complete = useCompleteMission();

  async function handleAccept(id: string, name: string) {
    try { await accept.mutateAsync(id); toast.success(`Đã nhận nhiệm vụ: ${name}`); }
    catch (e: any) { toast.error(e.message || "Thất bại"); }
  }
  async function handleComplete(id: string, name: string) {
    try { const r = await complete.mutateAsync(id); toast.success(r.message || `Hoàn thành: ${name}`); }
    catch (e: any) { toast.error(e.message || "Thất bại"); }
  }
  async function handleTalk(npcId: string) {
    try {
      const r = await talk.mutateAsync(npcId) as any;
      toast.success(`${r.message} Thân thiện +${r.affinityGained}.`);
    } catch (e: any) {
      toast.error(e.message || "Không thể trò chuyện");
    }
  }

  if (isLoading) return <div className="p-8 text-amber-800 text-center animate-pulse">Đang triệu hồi NPC...</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-amber-500 font-bold tracking-widest mb-2 text-lg">NHÂN VẬT NPC</h1>
      <p className="text-amber-800 text-xs mb-6">Đệ tử Hoa Thiên Môn và những người quan trọng trên con đường tu tiên của ngươi.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {npcs?.map((npc: any) => {
          const elColor = npc.element ? ELEMENT_COLORS[npc.element] : "#78350f";
          const isSelected = selectedNpc?.id === npc.id;
          return (
            <button key={npc.id} onClick={() => setSelectedNpc(isSelected ? null : npc)}
              className={`text-left p-4 rounded-sm border transition-all ${isSelected ? "border-amber-500/50 bg-amber-900/20" : "border-amber-900/20 bg-[#120e08] hover:border-amber-800/40"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ borderColor: elColor, color: elColor, background: `${elColor}15` }}>
                  {npc.avatarCode ?? npc.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-amber-300 font-medium text-sm">{npc.name}</div>
                  <div className="text-amber-800 text-xs truncate">{npc.title}</div>
                  {npc.element && (
                    <div className="text-xs mt-0.5" style={{ color: elColor }}>{ELEMENT_NAMES[npc.element]} hệ</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-amber-900 border border-amber-900/20 rounded-sm px-1.5 py-0.5 inline-block mb-2">
                {ROLE_LABELS[npc.role] || npc.role}
              </div>
              <p className="text-xs text-amber-800 line-clamp-2">{npc.description}</p>
            </button>
          );
        })}
      </div>

      {selectedNpc && (
        <div className="bg-[#0f0c06] border border-amber-900/30 rounded-sm p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                borderColor: selectedNpc.element ? ELEMENT_COLORS[selectedNpc.element] : "#78350f",
                color: selectedNpc.element ? ELEMENT_COLORS[selectedNpc.element] : "#78350f",
                background: `${selectedNpc.element ? ELEMENT_COLORS[selectedNpc.element] : "#78350f"}15`,
              }}>
              {selectedNpc.avatarCode ?? selectedNpc.name[0]}
            </div>
            <div>
              <h2 className="text-amber-300 font-bold text-base mb-0.5">{selectedNpc.name}</h2>
              <div className="text-amber-700 text-sm mb-2">{selectedNpc.title}</div>
              <p className="text-amber-800 text-xs">{selectedNpc.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-xs text-amber-800">
                  Thân thiện: <span className="text-amber-400 tabular-nums">{affinity?.affinity ?? 0}/100</span>
                </div>
                <button
                  onClick={() => handleTalk(selectedNpc.id)}
                  disabled={talk.isPending}
                  className="px-3 py-1.5 text-xs border border-amber-800/40 text-amber-600 hover:text-amber-400 rounded-sm transition-all disabled:opacity-50"
                >
                  Trò chuyện
                </button>
              </div>
            </div>
          </div>

          {selectedNpc.dialogue && (
            <div className="mb-6 bg-[#120e08] border border-amber-900/20 rounded-sm p-4">
              <div className="text-amber-700 text-xs mb-2 tracking-wider">LỜI THOẠI</div>
              <p className="text-amber-500 text-sm italic">"{selectedNpc.dialogue.greet}"</p>
            </div>
          )}

          <div>
            <div className="text-amber-700 text-xs mb-3 tracking-wider">NHIỆM VỤ CÓ THỂ NHẬN</div>
            {questsLoading ? (
              <div className="text-amber-800 text-xs animate-pulse">Đang tải nhiệm vụ...</div>
            ) : !quests?.length ? (
              <div className="text-amber-800 text-xs">Không có nhiệm vụ mới.</div>
            ) : (
              <div className="space-y-3">
                {quests.map((q: any) => (
                  <div key={q.id} className={`border rounded-sm p-4 ${q.status === "claimed" ? "opacity-40 border-amber-900/10" : "border-amber-900/20 bg-[#120e08]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-amber-900 border border-amber-900/20 rounded-sm px-1.5 py-0.5">{q.type}</span>
                          <span className={`text-xs ${STATUS_COLORS[q.status] || "text-amber-800"}`}>{STATUS_LABELS[q.status] || q.status}</span>
                        </div>
                        <div className="text-amber-300 text-sm font-medium mb-1">{q.name}</div>
                        <div className="text-amber-800 text-xs mb-2">{q.description}</div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-amber-700">+{q.rewardExp?.toLocaleString()} EXP</span>
                          <span className="text-amber-700">+{q.rewardLinhThach?.toLocaleString()} LS</span>
                          {q.rewardItems?.length > 0 && <span className="text-emerald-700">+{q.rewardItems.length} vật phẩm</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {q.status === "available" && (
                          <button onClick={() => handleAccept(q.id, q.name)} disabled={accept.isPending}
                            className="px-3 py-1.5 text-xs border border-emerald-900/40 text-emerald-700 hover:text-emerald-500 rounded-sm transition-all disabled:opacity-50">
                            Nhận
                          </button>
                        )}
                        {(q.status === "accepted" || q.status === "completed") && (
                          <button onClick={() => handleComplete(q.id, q.name)} disabled={complete.isPending}
                            className="px-3 py-1.5 text-xs border border-amber-900/40 text-amber-600 hover:text-amber-400 rounded-sm transition-all disabled:opacity-50">
                            Hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
