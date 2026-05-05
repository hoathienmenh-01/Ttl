import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminStats, useAdminPlayers, useAdminTopups, useApproveTopup,
  useAdminEconomyLogs, useAdminGrantMonthlyCard, useAdminGiveItem, useAdminItemTemplates,
} from "@/lib/hooks";

type Tab = "overview" | "players" | "topup" | "economy" | "items";

const LOG_TYPE_LABEL: Record<string, string> = {
  linh_thach_gain: "Nhận LS",
  linh_thach_spend: "Tiêu LS",
  exp_gain: "Nhận EXP",
  item_grant: "Nhận Vật Phẩm",
};
const LOG_TYPE_COLOR: Record<string, string> = {
  linh_thach_gain: "text-amber-400",
  linh_thach_spend: "text-red-500",
  exp_gain: "text-emerald-400",
  item_grant: "text-purple-400",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [ecoSearch, setEcoSearch] = useState("");
  const [selectedCharId, setSelectedCharId] = useState<string | undefined>(undefined);
  const [grantCharId, setGrantCharId] = useState("");
  const [giveCharId, setGiveCharId] = useState("");
  const [giveTemplateId, setGiveTemplateId] = useState("");
  const [giveQty, setGiveQty] = useState(1);

  const { data: stats } = useAdminStats();
  const { data: players, isLoading: loadingPlayers } = useAdminPlayers(search || undefined);
  const { data: topups } = useAdminTopups();
  const { data: ecoLogs, isLoading: loadingEco } = useAdminEconomyLogs(selectedCharId);
  const { data: itemTemplates } = useAdminItemTemplates();
  const approve = useApproveTopup();
  const grantCard = useAdminGrantMonthlyCard();
  const giveItem = useAdminGiveItem();

  async function handleApprove(id: string) {
    try {
      const res = await approve.mutateAsync(id);
      toast.success(res.message || "Đã duyệt.");
    } catch (err: any) {
      toast.error(err.message || "Duyệt thất bại");
    }
  }

  async function handleGrantCard() {
    if (!grantCharId.trim()) { toast.error("Nhập charId trước"); return; }
    try {
      const r = await grantCard.mutateAsync({ charId: grantCharId.trim(), days: 30 });
      toast.success((r as any).message || "Đã cấp thẻ!");
      setGrantCharId("");
    } catch (e: any) {
      toast.error(e.message || "Cấp thẻ thất bại");
    }
  }

  const statCards = stats ? [
    { label: "Tổng Người Dùng", value: stats.totalUsers },
    { label: "Trực Tuyến (est)", value: stats.onlineNow },
    { label: "Nhân Vật", value: stats.totalCharacters },
    { label: "Chờ Nạp Tiền", value: stats.pendingTopups },
    { label: "Đang Tu Luyện", value: stats.cultivatingNow },
    { label: "Nguyệt Đạo Thẻ", value: stats.activeMonthlyCards ?? 0 },
    { label: "Tổng Nạp (VND)", value: stats.totalTopupVnd?.toLocaleString() || 0 },
  ] : [];

  async function handleGiveItem() {
    if (!giveCharId.trim()) { toast.error("Nhập CharID trước"); return; }
    if (!giveTemplateId.trim()) { toast.error("Chọn item template"); return; }
    try {
      const r: any = await giveItem.mutateAsync({ charId: giveCharId.trim(), templateId: giveTemplateId.trim(), qty: giveQty });
      toast.success(r.message || "Đã cấp item!");
    } catch (e: any) {
      toast.error(e.data?.error || e.message || "Cấp item thất bại");
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Tổng Quan" },
    { id: "players", label: "Người Dùng" },
    { id: "topup", label: "Nạp Tiền" },
    { id: "economy", label: "Kinh Tế" },
    { id: "items", label: "Cấp Vật Phẩm" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-red-500 font-bold tracking-widest mb-4 text-lg">QUẢN TRỊ HỆ THỐNG</h1>

      <div className="flex gap-2 mb-6 border-b border-amber-900/20 pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs tracking-widest border-b-2 transition-all -mb-px ${
              tab === t.id
                ? "border-amber-600 text-amber-400"
                : "border-transparent text-amber-800 hover:text-amber-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {statCards.map(s => (
              <div key={s.label} className="bg-[#120e08] border border-amber-900/20 rounded-sm p-4 text-center">
                <div className="text-amber-800 text-xs mb-1">{s.label}</div>
                <div className="text-amber-400 font-bold text-lg">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="border border-amber-900/20 rounded-sm p-4">
            <div className="text-amber-700 text-xs tracking-widest mb-3">CẤP NGUYỆT ĐẠO THẺ (ADMIN)</div>
            <div className="flex gap-2 flex-wrap">
              <input
                value={grantCharId}
                onChange={e => setGrantCharId(e.target.value)}
                placeholder="Character ID..."
                className="flex-1 min-w-0 bg-[#1a1208] border border-amber-900/30 rounded-sm px-3 py-1.5 text-amber-300 placeholder-amber-900 text-xs focus:outline-none focus:border-amber-700"
              />
              <button
                onClick={handleGrantCard}
                disabled={grantCard.isPending}
                className="px-4 py-1.5 text-xs border border-emerald-800/50 text-emerald-600 hover:text-emerald-400 rounded-sm transition-all disabled:opacity-50"
              >
                {grantCard.isPending ? "Đang cấp..." : "Cấp 30 Ngày"}
              </button>
            </div>
            <div className="text-amber-900 text-xs mt-2">Lấy Character ID từ tab Người Dùng.</div>
          </div>
        </>
      )}

      {tab === "players" && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm username/email..."
              className="bg-[#1a1208] border border-amber-900/30 rounded-sm px-3 py-1.5 text-amber-300 placeholder-amber-900 text-xs focus:outline-none focus:border-amber-700 w-64"
            />
          </div>
          {loadingPlayers ? (
            <div className="text-amber-800 text-center py-8">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-900/20">
                    <th className="text-left text-amber-800 py-2 px-3">Tài Khoản</th>
                    <th className="text-left text-amber-800 py-2 px-3">Nhân Vật</th>
                    <th className="text-left text-amber-800 py-2 px-3">Cảnh Giới</th>
                    <th className="text-left text-amber-800 py-2 px-3">LS</th>
                    <th className="text-left text-amber-800 py-2 px-3">TN</th>
                    <th className="text-left text-amber-800 py-2 px-3">Nguyệt Thẻ</th>
                    <th className="text-left text-amber-800 py-2 px-3">CharID</th>
                  </tr>
                </thead>
                <tbody>
                  {players?.map((p: any) => (
                    <tr key={p.id} className="border-b border-amber-900/10 hover:bg-amber-900/5">
                      <td className="py-2 px-3">
                        <span className={p.role === "admin" ? "text-red-500" : "text-amber-600"}>{p.username}</span>
                      </td>
                      <td className="py-2 px-3 text-amber-400">{p.characterName || "—"}</td>
                      <td className="py-2 px-3 text-amber-700">{p.realmName || "—"}</td>
                      <td className="py-2 px-3 text-amber-500">{p.linhThach?.toLocaleString() || "—"}</td>
                      <td className="py-2 px-3 text-purple-400">{p.tienNgoc ?? "—"}</td>
                      <td className="py-2 px-3">
                        {p.monthlyCardActive ? (
                          <span className="text-emerald-500">
                            ✓ {p.monthlyCardExpiresAt ? new Date(p.monthlyCardExpiresAt).toLocaleDateString("vi-VN") : ""}
                          </span>
                        ) : (
                          <span className="text-amber-900">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => { navigator.clipboard.writeText(p.characterId || ""); toast.success("Đã copy CharID!"); }}
                          className="text-amber-900 hover:text-amber-600 font-mono text-xs"
                          title={p.characterId || "—"}
                        >
                          {p.characterId ? p.characterId.slice(0, 8) + "…" : "—"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "topup" && (
        <div>
          {!topups?.length ? (
            <div className="text-amber-900 text-center py-8">Không có yêu cầu nạp tiền nào đang chờ.</div>
          ) : (
            <div className="space-y-2">
              {topups.map((t: any) => (
                <div key={t.id} className="bg-[#120e08] border border-amber-900/30 rounded-sm p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-300 font-medium">{t.amount.toLocaleString()} VND → {t.tienNgocGranted} Tiên Ngọc</div>
                    <div className="text-xs text-amber-900 font-mono">{t.transferCode}</div>
                    <div className="text-xs text-amber-900">{new Date(t.createdAt).toLocaleString("vi-VN")}</div>
                  </div>
                  <button
                    onClick={() => handleApprove(t.id)}
                    disabled={approve.isPending}
                    className="px-3 py-1.5 text-xs border border-emerald-900/40 text-emerald-600 hover:text-emerald-400 rounded-sm transition-all disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "items" && (
        <div className="space-y-6">
          <div className="border border-amber-900/20 rounded-sm p-4">
            <div className="text-amber-700 text-xs tracking-widest mb-3">CẤP VẬT PHẨM CHO NHÂN VẬT (ADMIN)</div>
            <div className="space-y-3">
              <div>
                <label className="text-amber-900 text-xs block mb-1">Character ID</label>
                <input
                  value={giveCharId}
                  onChange={e => setGiveCharId(e.target.value)}
                  placeholder="CharID (lấy từ tab Người Dùng)..."
                  className="w-full bg-[#1a1208] border border-amber-900/30 rounded-sm px-3 py-1.5 text-amber-300 placeholder-amber-900 text-xs focus:outline-none focus:border-amber-700"
                />
              </div>
              <div>
                <label className="text-amber-900 text-xs block mb-1">Item Template</label>
                <select
                  value={giveTemplateId}
                  onChange={e => setGiveTemplateId(e.target.value)}
                  className="w-full bg-[#1a1208] border border-amber-900/30 rounded-sm px-3 py-1.5 text-amber-300 text-xs focus:outline-none focus:border-amber-700"
                >
                  <option value="">-- Chọn item --</option>
                  {itemTemplates?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.type} · {t.quality})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-amber-900 text-xs block mb-1">Số Lượng</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={giveQty}
                  onChange={e => setGiveQty(Math.max(1, Math.min(99, Number(e.target.value))))}
                  className="w-24 bg-[#1a1208] border border-amber-900/30 rounded-sm px-3 py-1.5 text-amber-300 text-xs focus:outline-none focus:border-amber-700"
                />
              </div>
              <button
                onClick={handleGiveItem}
                disabled={giveItem.isPending}
                className="px-4 py-2 text-xs border border-emerald-800/50 text-emerald-600 hover:text-emerald-400 rounded-sm transition-all disabled:opacity-50"
              >
                {giveItem.isPending ? "Đang cấp..." : "Cấp Vật Phẩm"}
              </button>
            </div>
            <div className="text-amber-900 text-xs mt-3">
              Dùng để test inventory — thêm item trực tiếp vào kho nhân vật bất kỳ.
            </div>
          </div>
        </div>
      )}

      {tab === "economy" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="text-amber-700 text-xs tracking-widest">NHẬT KÝ KINH TẾ</div>
            <input
              value={ecoSearch}
              onChange={e => setEcoSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSelectedCharId(ecoSearch.trim() || undefined)}
              placeholder="CharID để lọc (Enter)..."
              className="bg-[#1a1208] border border-amber-900/30 rounded-sm px-3 py-1.5 text-amber-300 placeholder-amber-900 text-xs focus:outline-none focus:border-amber-700 w-72"
            />
            <button
              onClick={() => setSelectedCharId(ecoSearch.trim() || undefined)}
              className="px-3 py-1.5 text-xs border border-amber-800/40 text-amber-600 hover:text-amber-400 rounded-sm"
            >
              Lọc
            </button>
            {selectedCharId && (
              <button
                onClick={() => { setSelectedCharId(undefined); setEcoSearch(""); }}
                className="px-3 py-1.5 text-xs border border-amber-900/20 text-amber-800 hover:text-amber-600 rounded-sm"
              >
                Xóa Lọc
              </button>
            )}
          </div>

          {loadingEco ? (
            <div className="text-amber-800 text-center py-8">Đang tải nhật ký...</div>
          ) : !ecoLogs?.length ? (
            <div className="text-amber-900 text-center py-8">Chưa có nhật ký kinh tế nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-900/20">
                    <th className="text-left text-amber-800 py-2 px-3">Thời Gian</th>
                    <th className="text-left text-amber-800 py-2 px-3">Loại</th>
                    <th className="text-left text-amber-800 py-2 px-3">Số Lượng</th>
                    <th className="text-left text-amber-800 py-2 px-3">Nguồn</th>
                    <th className="text-left text-amber-800 py-2 px-3">Số Dư Sau</th>
                    <th className="text-left text-amber-800 py-2 px-3">CharID</th>
                  </tr>
                </thead>
                <tbody>
                  {ecoLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-amber-900/10 hover:bg-amber-900/5">
                      <td className="py-1.5 px-3 text-amber-900 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className={`py-1.5 px-3 ${LOG_TYPE_COLOR[log.type] || "text-amber-700"}`}>
                        {LOG_TYPE_LABEL[log.type] || log.type}
                      </td>
                      <td className="py-1.5 px-3 text-amber-300 font-mono">+{log.amount?.toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-amber-800">{log.source}</td>
                      <td className="py-1.5 px-3 text-amber-700 font-mono">{log.balanceAfter?.toLocaleString() ?? "—"}</td>
                      <td className="py-1.5 px-3 text-amber-900 font-mono">{log.charId?.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
