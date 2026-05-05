/* Shared UI primitives for Tu Tiên Lộ */

/** Full-page spinner */
export function PageSpinner({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-amber-900 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-amber-800 text-xs tracking-widest animate-pulse">{label}</p>
    </div>
  );
}

/** Skeleton line */
export function Skel({ className = "" }: { className?: string }) {
  return <div className={`bg-amber-950/40 rounded-sm animate-pulse ${className}`} />;
}

/** Empty state with icon */
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="text-4xl opacity-15">{icon}</div>
      <p className="text-amber-800 text-sm font-medium">{title}</p>
      {sub && <p className="text-amber-900 text-xs">{sub}</p>}
    </div>
  );
}

/** Error state */
export function ErrorState({ message = "Không thể tải dữ liệu. Hãy thử lại sau." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="text-3xl opacity-30">⊘</div>
      <p className="text-red-800 text-sm">{message}</p>
    </div>
  );
}

/** Section card */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#120e08] border border-amber-900/25 rounded-sm ${className}`}>
      {children}
    </div>
  );
}

/** Section header inside a card */
export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-amber-800 text-xs tracking-[0.2em] uppercase font-medium">{children}</p>
  );
}

/** Stat pill: label + value */
export function StatPill({ label, value, color = "text-amber-300" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0f0c06] border border-amber-900/15 rounded-sm p-2.5 text-center">
      <div className="text-amber-900 text-xs mb-0.5">{label}</div>
      <div className={`font-bold text-base tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

/** Thin progress bar */
export function ProgressBar({
  pct, color = "#f59e0b", bg = "#451a03", glow = false, height = "h-2", animated = false,
}: { pct: number; color?: string; bg?: string; glow?: boolean; height?: string; animated?: boolean }) {
  return (
    <div className={`${height} rounded-full overflow-hidden`} style={{ background: bg }}>
      <div
        className={`h-full transition-all duration-700 ${animated ? "animate-pulse" : ""}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color, boxShadow: glow ? `0 0 8px ${color}88` : "none" }}
      />
    </div>
  );
}

/** Standard page title */
export function PageTitle({ icon, title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {icon && <span className="text-amber-700 text-base">{icon}</span>}
        <h1 className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase">{title}</h1>
      </div>
      {sub && <p className="text-amber-900 text-xs mt-1 ml-5">{sub}</p>}
    </div>
  );
}

/** Filter tab group */
export function TabBar({ tabs, value, onChange }: { tabs: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 mb-5">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1.5 text-xs tracking-wider rounded-sm border transition-all ${
            value === t.value
              ? "bg-amber-900/30 border-amber-600/50 text-amber-300"
              : "bg-[#0f0c06] border-amber-900/20 text-amber-800 hover:border-amber-800/60 hover:text-amber-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Primary action button */
export function Btn({
  onClick, disabled, children, variant = "gold", className = "", loading = false,
}: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode;
  variant?: "gold" | "red" | "green" | "blue" | "ghost"; className?: string; loading?: boolean;
}) {
  const variants = {
    gold: "bg-amber-900/25 border-amber-700/50 text-amber-400 hover:bg-amber-900/40 hover:border-amber-600",
    red:  "bg-red-900/20 border-red-800/40 text-red-400 hover:bg-red-900/35",
    green:"bg-emerald-900/20 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/35",
    blue: "bg-blue-900/20 border-blue-800/40 text-blue-400 hover:bg-blue-900/35",
    ghost:"bg-transparent border-amber-900/25 text-amber-800 hover:text-amber-600 hover:border-amber-800/50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`border rounded-sm text-xs font-medium tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? "..." : children}
    </button>
  );
}

/** Quality badge */
const Q_COLOR: Record<string, string> = {
  pham: "#94a3b8", linh: "#22c55e", huyen: "#38bdf8", tien: "#a855f7", than: "#f59e0b",
};
const Q_LABEL: Record<string, string> = {
  pham: "Phàm", linh: "Linh", huyen: "Huyền", tien: "Tiên", than: "Thần",
};
export function QualityBadge({ quality }: { quality: string }) {
  const c = Q_COLOR[quality] || "#94a3b8";
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-sm border" style={{ color: c, borderColor: c + "44", background: c + "11" }}>
      {Q_LABEL[quality] || quality}
    </span>
  );
}

/** Resource chip: icon + value */
export function ResourceChip({ icon, value, label, color = "text-amber-400" }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-amber-800">{icon}</span>
      <span className={`font-bold tabular-nums ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}</span>
      <span className="text-amber-900">{label}</span>
    </div>
  );
}

/** Divider with optional label */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="border-t border-amber-900/15 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-amber-900/15" />
      <span className="text-amber-900 text-xs tracking-widest">{label}</span>
      <div className="flex-1 border-t border-amber-900/15" />
    </div>
  );
}

/** Reward pill row: EXP + LS + items */
export function RewardRow({ exp, ls, items }: { exp?: number; ls?: number; items?: number }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {exp != null && exp > 0 && (
        <span className="px-2 py-0.5 bg-amber-900/15 border border-amber-900/20 text-amber-600 rounded-sm">
          +{exp.toLocaleString()} EXP
        </span>
      )}
      {ls != null && ls > 0 && (
        <span className="px-2 py-0.5 bg-amber-900/15 border border-amber-900/20 text-amber-500 rounded-sm">
          +{ls.toLocaleString()} LS
        </span>
      )}
      {items != null && items > 0 && (
        <span className="px-2 py-0.5 bg-emerald-900/15 border border-emerald-900/20 text-emerald-600 rounded-sm">
          +{items} vật phẩm
        </span>
      )}
    </div>
  );
}
