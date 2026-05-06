import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiUrl, getToken } from "@/lib/api";
import { Card, EmptyState, PageSpinner, PageTitle, QualityBadge, Btn } from "@/components/ui";
import { ELEMENT_COLORS, ELEMENT_NAMES } from "@/lib/constants";

async function get(path: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("Lỗi tải dữ liệu linh thú");
  return res.json();
}

function usePetCatalog() {
  return useQuery({ queryKey: ["pet-catalog"], queryFn: () => get("/pet/catalog") });
}

function useMyPets() {
  return useQuery({ queryKey: ["pet-mine"], queryFn: () => get("/pet/mine") });
}

function useClaimPet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => apiPost(`/pet/${petId}/claim`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pet-mine"] });
      qc.invalidateQueries({ queryKey: ["pet-catalog"] });
    },
  });
}

function useEquipPet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => apiPost(`/pet/${petId}/equip`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pet-mine"] }),
  });
}

function useUnequipPet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => apiPost(`/pet/${petId}/unequip`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pet-mine"] }),
  });
}

function bonusText(pet: any) {
  const stats = pet.bonusStats ?? {};
  const parts = [
    stats.atkPct ? `ATK +${Math.round(stats.atkPct * 100)}%` : null,
    stats.defPct ? `DEF +${Math.round(stats.defPct * 100)}%` : null,
    pet.procChance && pet.procDamagePct ? `Proc ${Math.round(pet.procChance * 100)}% gây +${Math.round(pet.procDamagePct * 100)}% sát thương` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Hỗ trợ tinh thần";
}

function unlockText(pet: any) {
  if (pet.unlockSource === "starter") return "Mở khóa: nhập môn";
  if (pet.unlockSource === "mission") return `Mở khóa: nhiệm vụ ${pet.unlockRef}`;
  if (pet.unlockSource === "boss") return `Mở khóa: boss ${pet.unlockRef}`;
  if (pet.unlockSource === "event") return pet.unlockRef === "dungeon_clears_3" ? "Mở khóa: hoàn thành 3 bí cảnh" : "Mở khóa: sự kiện";
  return "Mở khóa qua gameplay";
}

export default function PetPage() {
  const { data: catalog, isLoading: catalogLoading } = usePetCatalog();
  const { data: mine, isLoading: mineLoading } = useMyPets();
  const claim = useClaimPet();
  const equip = useEquipPet();
  const unequip = useUnequipPet();
  const ownedIds = new Set((mine ?? []).map((p: any) => p.petId));
  const activePet = (mine ?? []).find((p: any) => p.active);

  async function handleClaim(pet: any) {
    try {
      const res = await claim.mutateAsync(pet.id) as any;
      toast.success(res.message || `Đã kết duyên với ${pet.name}`);
    } catch (e: any) {
      toast.error(e?.data?.error || e.message || "Không thể nhận linh thú");
    }
  }

  async function handleEquip(petId: string) {
    try {
      const res = await equip.mutateAsync(petId) as any;
      toast.success(res.message || "Đã chọn linh thú đồng hành");
    } catch (e: any) {
      toast.error(e?.data?.error || e.message || "Không thể chọn linh thú");
    }
  }

  async function handleUnequip(petId: string) {
    try {
      const res = await unequip.mutateAsync(petId) as any;
      toast.success(res.message || "Đã cho linh thú nghỉ");
    } catch (e: any) {
      toast.error(e?.data?.error || e.message || "Không thể gỡ linh thú");
    }
  }

  if (catalogLoading || mineLoading) return <PageSpinner label="ĐANG GỌI LINH THÚ..." />;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageTitle
        icon="◇"
        title="Linh Thú Đồng Hành"
        sub="Linh thú chỉ hỗ trợ nhẹ trong combat. Toàn bộ bonus và proc được server tính toán."
      />

      {activePet && (
        <Card className="p-4 mb-5 border-emerald-900/35 bg-emerald-950/10">
          <div className="text-emerald-400 text-xs tracking-[0.18em] uppercase mb-1">Đang đồng hành</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-amber-300 font-medium">{activePet.name}</div>
            <QualityBadge quality={activePet.rarity} />
            <div className="text-xs text-emerald-300">Lv.{activePet.level} {activePet.expRequired ? `· ${activePet.exp}/${activePet.expRequired} EXP` : "· MAX"}</div>
            <div className="text-xs text-amber-700">{bonusText(activePet)}</div>
            <Btn variant="ghost" className="ml-auto px-3 py-2" loading={unequip.isPending} onClick={() => handleUnequip(activePet.petId)}>
              Cho Nghỉ
            </Btn>
          </div>
        </Card>
      )}

      {!catalog?.length ? (
        <EmptyState icon="◇" title="Chưa có linh thú trong catalog." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {catalog.map((pet: any) => {
            const owned = ownedIds.has(pet.id);
            const minePet = (mine ?? []).find((p: any) => p.petId === pet.id);
            const active = !!minePet?.active;
            const elColor = pet.element ? ELEMENT_COLORS[pet.element] : "#92400e";
            return (
              <Card key={pet.id} className={`p-4 ${active ? "border-emerald-700/45" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ borderColor: elColor, color: elColor, background: `${elColor}14` }}
                    >
                      {pet.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-amber-300 text-sm font-medium truncate">{pet.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: elColor }}>{pet.element ? ELEMENT_NAMES[pet.element] : "Vô hệ"}</span>
                        <QualityBadge quality={pet.rarity} />
                      </div>
                    </div>
                  </div>
                  {active && <span className="text-xs text-emerald-400 border border-emerald-800/40 rounded-sm px-2 py-1">Active</span>}
                </div>
                <p className="text-xs text-amber-800 leading-relaxed mb-3">{pet.description}</p>
                <div className="text-xs text-blue-300 border border-blue-900/25 bg-blue-950/10 rounded-sm px-3 py-2 mb-3">
                  {bonusText(pet)}
                </div>
                <div className="text-xs text-amber-900 mb-3">
                  {owned && minePet ? (
                    <span>Lv.{minePet.level} {minePet.expRequired ? `· ${minePet.exp}/${minePet.expRequired} EXP` : "· MAX"}</span>
                  ) : (
                    <span>{unlockText(pet)}</span>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  {!owned ? (
                    <Btn className="px-3 py-2" loading={claim.isPending} disabled={!pet.canClaim} onClick={() => handleClaim(pet)}>
                      {pet.canClaim ? "Kết Duyên" : "Chưa Mở"}
                    </Btn>
                  ) : active ? (
                    <Btn variant="ghost" className="px-3 py-2" loading={unequip.isPending} onClick={() => handleUnequip(pet.id)}>
                      Cho Nghỉ
                    </Btn>
                  ) : (
                    <Btn variant="green" className="px-3 py-2" loading={equip.isPending} onClick={() => handleEquip(pet.id)}>
                      Đồng Hành
                    </Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
