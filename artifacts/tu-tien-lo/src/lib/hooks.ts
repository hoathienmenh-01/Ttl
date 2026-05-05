import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, apiPost, getToken } from "./api";

async function get(path: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
    throw Object.assign(new Error(err.error || "Lỗi máy chủ"), { status: res.status, data: err });
  }
  return res.json();
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => get("/auth/me"), retry: false });
}

export function useCharacter(opts?: { refetchInterval?: number }) {
  return useQuery({ queryKey: ["character"], queryFn: () => get("/character"), retry: false, refetchInterval: opts?.refetchInterval });
}

export function useCharacterStats() {
  return useQuery({ queryKey: ["character-stats"], queryFn: () => get("/character/stats"), retry: false });
}

export function useRealms() {
  return useQuery({ queryKey: ["realms"], queryFn: () => get("/cultivation/realms") });
}

export function useInventory(type?: string) {
  return useQuery({ queryKey: ["inventory", type], queryFn: () => get(`/inventory${type ? `?type=${type}` : ""}`) });
}

export function useBosses() {
  return useQuery({ queryKey: ["bosses"], queryFn: () => get("/boss"), refetchInterval: 30000 });
}

export function useMissions() {
  return useQuery({ queryKey: ["missions"], queryFn: () => get("/mission") });
}

export function useChatMessages(channel: string) {
  return useQuery({ queryKey: ["chat", channel], queryFn: () => get(`/chat/messages?channel=${channel}`), refetchInterval: 5000 });
}

export function useSects() {
  return useQuery({ queryKey: ["sects"], queryFn: () => get("/sect") });
}

export function useMySect() {
  return useQuery({ queryKey: ["my-sect"], queryFn: () => get("/sect/mine"), retry: false });
}

export function useMarket(type?: string) {
  return useQuery({ queryKey: ["market", type], queryFn: () => get(`/market${type ? `?type=${type}` : ""}`) });
}

export function useLeaderboard(type?: string) {
  return useQuery({ queryKey: ["leaderboard", type], queryFn: () => get(`/leaderboard${type ? `?type=${type}` : ""}`) });
}

export function useTopupHistory() {
  return useQuery({ queryKey: ["topup-history"], queryFn: () => get("/topup/history") });
}

export function useOnlinePlayers() {
  return useQuery({ queryKey: ["online-players"], queryFn: () => get("/character/online"), refetchInterval: 15000 });
}

export function useAdminStats() {
  return useQuery({ queryKey: ["admin-stats"], queryFn: () => get("/admin/stats") });
}

export function useAdminPlayers(search?: string) {
  return useQuery({ queryKey: ["admin-players", search], queryFn: () => get(`/admin/players${search ? `?search=${search}` : ""}`) });
}

export function useAdminTopups() {
  return useQuery({ queryKey: ["admin-topups"], queryFn: () => get("/admin/topup") });
}

export function useStartCultivation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => apiPost("/cultivation/start"), onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }) });
}

export function useStopCultivation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => apiPost("/cultivation/stop"), onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }) });
}

export function useBreakthrough() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => apiPost("/cultivation/breakthrough"), onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }) });
}

export function useEquipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/inventory/${id}/equip`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["character"] });
      qc.invalidateQueries({ queryKey: ["character-stats"] });
    },
  });
}

export function useUnequipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/inventory/${id}/unequip`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["character"] });
      qc.invalidateQueries({ queryKey: ["character-stats"] });
    },
  });
}

export function useUseItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiPost(`/inventory/${id}/use`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); qc.invalidateQueries({ queryKey: ["character"] }); } });
}

export function useSellItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, qty }: { id: string; qty: number }) => apiPost(`/inventory/${id}/sell`, { qty }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); qc.invalidateQueries({ queryKey: ["character"] }); } });
}

export function useAttackBoss() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (bossId: string) => apiPost(`/boss/${bossId}/attack`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["bosses"] }); qc.invalidateQueries({ queryKey: ["character"] }); } });
}

export function useAcceptMission() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiPost(`/mission/${id}/accept`), onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }) });
}

export function useCompleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/mission/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["character"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { channel: string; content: string }) => apiPost("/chat/send", data), onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["chat", vars.channel] }) });
}

export function useJoinSect() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (sectId: string) => apiPost(`/sect/${sectId}/join`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["sects"] }); qc.invalidateQueries({ queryKey: ["my-sect"] }); qc.invalidateQueries({ queryKey: ["character"] }); } });
}

export function useBuyMarketItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (listingId: string) => apiPost(`/market/${listingId}/buy`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["market"] }); qc.invalidateQueries({ queryKey: ["character"] }); qc.invalidateQueries({ queryKey: ["inventory"] }); } });
}

export function useRequestTopup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { amount: number; transferCode: string }) => apiPost("/topup/request", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["topup-history"] }) });
}

export function useApproveTopup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiPost(`/admin/topup/${id}/approve`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });
}

export function useRest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/character/rest"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }),
  });
}

export function useDailyReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/character/daily-reward"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }),
  });
}

export function useAchievements() {
  return useQuery({ queryKey: ["achievements"], queryFn: () => get("/achievement") });
}

export function useClaimAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/achievement/${id}/claim`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["achievements"] }); qc.invalidateQueries({ queryKey: ["character"] }); },
  });
}

export function useAlchemyRecipes() {
  return useQuery({ queryKey: ["alchemy-recipes"], queryFn: () => get("/alchemy/recipes") });
}

export function useCraftAlchemy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => apiPost(`/alchemy/craft/${recipeId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); qc.invalidateQueries({ queryKey: ["character"] }); qc.invalidateQueries({ queryKey: ["achievements"] }); },
  });
}

export function useNpcs() {
  return useQuery({ queryKey: ["npcs"], queryFn: () => get("/npc") });
}

export function useSkills() {
  return useQuery({ queryKey: ["skills"], queryFn: () => get("/skill") });
}

export function useDungeons() {
  return useQuery({ queryKey: ["dungeons"], queryFn: () => get("/dungeon") });
}

export function useBattlePass() {
  return useQuery({ queryKey: ["battle-pass"], queryFn: () => get("/battle-pass") });
}

export function useClaimBattlePassTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: number) => apiPost(`/battle-pass/claim/${tier}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["battle-pass"] });
      qc.invalidateQueries({ queryKey: ["character"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useEconomyLog() {
  return useQuery({ queryKey: ["economy-log"], queryFn: () => get("/economy-log") });
}

export function useActivateMonthlyCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/monthly-card/activate"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["character"] }),
  });
}

export function useAdminEconomyLogs(charId?: string) {
  return useQuery({
    queryKey: ["admin-economy-logs", charId],
    queryFn: () => get(`/admin/economy-logs${charId ? `?charId=${charId}&limit=200` : "?limit=100"}`),
  });
}

export function useAdminGiveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ charId, templateId, qty }: { charId: string; templateId: string; qty?: number }) =>
      apiPost("/admin/item/give", { charId, templateId, qty: qty ?? 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useAdminItemTemplates() {
  return useQuery({ queryKey: ["admin-item-templates"], queryFn: () => get("/admin/item/templates") });
}

export function useAdminGrantMonthlyCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ charId, days }: { charId: string; days?: number }) =>
      apiPost("/admin/monthly-card/grant", { charId, days }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-players"] }),
  });
}
