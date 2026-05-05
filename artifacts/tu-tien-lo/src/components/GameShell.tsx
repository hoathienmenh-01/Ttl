import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCharacter, useRest } from "@/lib/hooks";
import { clearToken } from "@/lib/api";
import { ELEMENT_NAMES, ELEMENT_COLORS } from "@/lib/constants";
import { toast } from "sonner";

const REST_COOLDOWN_SECONDS = 120;
function useRestCooldown(lastRestAt: string | null | undefined): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!lastRestAt) { setRemaining(0); return; }
    function tick() {
      const elapsed = (Date.now() - new Date(lastRestAt!).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(REST_COOLDOWN_SECONDS - elapsed)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRestAt]);
  return remaining;
}

const NAV_SECTIONS = [
  {
    label: "Tu Luyện",
    items: [
      { path: "/",           label: "Tổng Quan",   icon: "◈", exact: true },
      { path: "/cultivation",label: "Cảnh Giới",   icon: "☯" },
      { path: "/skill",      label: "Pháp Thuật",  icon: "✺" },
      { path: "/alchemy",    label: "Luyện Đan",   icon: "⊛" },
    ],
  },
  {
    label: "Chiến Đấu",
    items: [
      { path: "/dungeon",    label: "Bí Cảnh",     icon: "⚔" },
      { path: "/boss",       label: "Boss",         icon: "☠" },
    ],
  },
  {
    label: "Nhiệm Vụ & Kho",
    items: [
      { path: "/mission",    label: "Nhiệm Vụ",    icon: "✦" },
      { path: "/npc",        label: "NPC",          icon: "人" },
      { path: "/inventory",  label: "Kho Đồ",      icon: "⊞" },
      { path: "/achievement",label: "Thành Tựu",   icon: "◆" },
    ],
  },
  {
    label: "Xã Hội",
    items: [
      { path: "/sect",       label: "Tông Môn",    icon: "⊙" },
      { path: "/chat",       label: "Giao Lưu",    icon: "◎" },
      { path: "/leaderboard",label: "Xếp Hạng",    icon: "▲" },
      { path: "/online",     label: "Trực Tuyến",  icon: "○" },
    ],
  },
  {
    label: "Hệ Thống",
    items: [
      { path: "/battle-pass",label: "Hành Đạo Lệnh", icon: "⊕" },
      { path: "/monthly-card",label: "Nguyệt Đạo Thẻ", icon: "◉" },
      { path: "/economy-log",label: "Lịch Sử",     icon: "◎" },
      { path: "/market",     label: "Phiên Chợ",   icon: "⊕" },
      { path: "/topup",      label: "Nạp Tiền",    icon: "◉" },
      { path: "/guide",      label: "Hướng Dẫn",   icon: "?" },
    ],
  },
];

interface Props { children: React.ReactNode; user: any }

export default function GameShell({ children, user }: Props) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: char } = useCharacter({ refetchInterval: 8000 });
  const rest = useRest();
  const elColor    = ELEMENT_COLORS[char?.primaryElement ?? ""] || "#c9a84c";
  const restCooldown = useRestCooldown(char?.lastRestAt);

  const expPct     = char ? Math.min(100, (char.exp / char.expRequired) * 100) : 0;
  const hpPct      = char ? Math.min(100, (char.hp / char.hpMax) * 100) : 0;
  const staminaPct = char ? Math.min(100, (char.stamina / char.staminaMax) * 100) : 0;

  function logout() { clearToken(); window.location.href = "/auth"; }

  async function handleRest() {
    try {
      const r = await rest.mutateAsync();
      toast.success((r as any).message);
    } catch (e: any) {
      toast.error(e.message || "Không thể nghỉ ngơi");
    }
  }

  // Derived daily available check
  const isDailyAvailable = (() => {
    if (!char?.lastDailyClaimAt) return true;
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    return new Date(char.lastDailyClaimAt) < todayStart;
  })();

  function isActive(path: string, exact?: boolean) {
    if (exact) return location === path;
    return location === path || location.startsWith(path + "/");
  }

  return (
    <div className="min-h-screen bg-[#0a0805] flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="h-12 bg-[#0c0903] border-b border-amber-900/25 flex items-center px-3 gap-3 fixed top-0 left-0 right-0 z-30">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center text-amber-700 hover:text-amber-500 transition-colors flex-shrink-0"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
          </svg>
        </button>

        {/* Brand */}
        <span className="text-amber-600 font-bold tracking-[0.25em] text-xs hidden md:block whitespace-nowrap flex-shrink-0">
          HOA THIÊN MÔN
        </span>
        <div className="w-px h-4 bg-amber-900/40 hidden md:block flex-shrink-0" />

        {/* Character info */}
        {char ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Element dot + name */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: elColor, boxShadow: `0 0 5px ${elColor}` }} />
              <span className="text-amber-300 text-xs font-medium truncate max-w-[90px] sm:max-w-[140px]">{char.name}</span>
              {char.title && (
                <span className="hidden sm:inline text-amber-800 text-xs">「{char.title}」</span>
              )}
              {char.cultivating && (
                <span className="text-xs text-emerald-600 border border-emerald-900/50 rounded-sm px-1 py-0 animate-pulse hidden sm:block leading-4">⊙</span>
              )}
            </div>
            {/* Realm */}
            <span className="text-amber-800 text-xs hidden lg:block flex-shrink-0 truncate">{char.realmName}</span>
            {/* Mini EXP bar */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-900 flex-shrink-0">
              <div className="w-20 h-1.5 bg-amber-950 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${char.cultivating ? "animate-pulse" : ""}`}
                  style={{ width: `${expPct}%`, background: char.cultivating ? "#f59e0b" : "#92400e" }} />
              </div>
              <span className="tabular-nums">{expPct.toFixed(0)}%</span>
            </div>
          </div>
        ) : <div className="flex-1" />}

        {/* Right side: currency + actions */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {char && (
            <>
              {/* Daily indicator */}
              {isDailyAvailable && (
                <button
                  onClick={() => setLocation("/")}
                  className="hidden sm:flex items-center gap-1 text-xs text-amber-500 border border-amber-700/40 rounded-sm px-1.5 py-0.5 animate-pulse hover:bg-amber-900/20 transition-all"
                  title="Điểm danh hàng ngày"
                >
                  ✦ Điểm Danh
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 text-xs bg-amber-950/40 border border-amber-900/20 rounded-sm px-2 py-1">
                <span className="text-amber-900">LS</span>
                <span className="text-amber-400 font-medium tabular-nums">{char.linhThach.toLocaleString()}</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-xs bg-purple-950/30 border border-purple-900/20 rounded-sm px-2 py-1">
                <span className="text-purple-900">TN</span>
                <span className="text-purple-400 font-medium tabular-nums">{char.tienNgoc.toLocaleString()}</span>
              </div>
            </>
          )}
          <button
            onClick={logout}
            className="text-amber-900 hover:text-amber-700 text-xs tracking-widest transition-colors py-1 px-1"
          >
            Xuất
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-12">

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className={`fixed md:static top-12 left-0 bottom-0 w-52 bg-[#0c0903] border-r border-amber-900/20 z-20 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

          {/* Character mini-card in sidebar */}
          {char && (
            <div className="p-3 border-b border-amber-900/20">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ borderColor: elColor, color: elColor, background: `${elColor}11` }}>
                  {char.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-amber-300 text-xs font-medium truncate">{char.name}</div>
                  <div className="text-amber-900 text-xs truncate">{char.realmName}</div>
                </div>
              </div>

              {/* Vital bars */}
              <div className="space-y-1.5">
                {[
                  { label: "HP",      cur: char.hp,      max: char.hpMax,      pct: hpPct,      color: "#ef4444", bg: "#3b0000" },
                  { label: "TL",      cur: char.stamina, max: char.staminaMax, pct: staminaPct, color: "#3b82f6", bg: "#0a1930" },
                  { label: "EXP",     cur: char.exp,     max: char.expRequired, pct: expPct,    color: char.cultivating ? "#f59e0b" : "#92400e", bg: "#1c0a00" },
                ].map(v => (
                  <div key={v.label}>
                    <div className="flex justify-between text-xs text-amber-950 mb-0.5">
                      <span>{v.label}</span>
                      <span className="tabular-nums">{v.cur}/{v.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: v.bg }}>
                      <div className={`h-full transition-all ${v.label === "EXP" && char.cultivating ? "animate-pulse" : ""}`}
                        style={{ width: `${v.pct}%`, background: v.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick rest button */}
              <button
                onClick={handleRest}
                disabled={rest.isPending || restCooldown > 0 || (char.hp >= char.hpMax && char.stamina >= char.staminaMax)}
                className="w-full mt-2 py-1 text-xs border border-amber-900/25 text-amber-900 hover:text-amber-700 hover:border-amber-800/40 rounded-sm transition-all disabled:opacity-30"
              >
                {rest.isPending ? "Đang nghỉ..." : restCooldown > 0 ? `Nghỉ Ngơi (${restCooldown}s)` : "Nghỉ Ngơi"}
              </button>
            </div>
          )}

          {/* Navigation sections */}
          <nav className="flex-1 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-amber-900/30">
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                {/* Section label */}
                <div className="px-3 pt-3 pb-1">
                  <span className="text-amber-950 text-xs tracking-[0.15em] uppercase">{section.label}</span>
                </div>
                {section.items.map(item => {
                  const active = isActive(item.path, (item as any).exact);
                  return (
                    <button
                      key={item.path}
                      onClick={() => { setLocation(item.path); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all text-left ${
                        active
                          ? "text-amber-400 bg-amber-900/20 border-r-2 border-amber-500"
                          : "text-amber-800 hover:text-amber-600 hover:bg-amber-900/10"
                      }`}
                    >
                      <span className="w-4 text-center flex-shrink-0 text-base leading-none" style={{ fontSize: "13px" }}>{item.icon}</span>
                      <span className="tracking-wide leading-none">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Admin */}
            {(user?.role === "admin" || user?.role === "mod") && (
              <div>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-red-950 text-xs tracking-[0.15em] uppercase">Admin</span>
                </div>
                <button
                  onClick={() => { setLocation("/admin"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all text-left ${
                    isActive("/admin") ? "text-red-400 bg-red-900/20 border-r-2 border-red-500" : "text-red-900 hover:text-red-700 hover:bg-red-900/10"
                  }`}
                >
                  <span className="w-4 text-center flex-shrink-0">⊘</span>
                  <span>Quản Trị</span>
                </button>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-amber-900/15 flex-shrink-0">
            <div className="text-amber-950 text-xs text-center tracking-widest">HOA THIÊN MÔN v1.0</div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
