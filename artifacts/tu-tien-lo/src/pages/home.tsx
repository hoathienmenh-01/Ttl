import { useLocation } from "wouter";
import { toast } from "sonner";
import { useCharacter, useStartCultivation, useStopCultivation, useDailyReward, useRest, useBattlePass } from "@/lib/hooks";
import { ELEMENT_NAMES, ELEMENT_COLORS, GRADE_LABELS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { PageSpinner, Card, CardLabel, ProgressBar, StatPill, Btn } from "@/components/ui";

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

const STREAK_REWARDS = [
  { day: 1, ls: 50, item: null },
  { day: 2, ls: 100, item: "Hồi Khí Đan" },
  { day: 3, ls: 150, item: null },
  { day: 4, ls: 200, item: null },
  { day: 5, ls: 300, item: "Khai Tâm Đan" },
  { day: 6, ls: 400, item: null },
  { day: 7, ls: 800, item: "Trúc Cơ Đan" },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { data: char, isLoading, refetch } = useCharacter({ refetchInterval: 8000 });
  const { data: bpData } = useBattlePass();
  const startCult = useStartCultivation();
  const stopCult = useStopCultivation();
  const dailyReward = useDailyReward();
  const rest = useRest();
  const restCooldown = useRestCooldown(char?.lastRestAt);

  if (isLoading) return <PageSpinner label="KHAI THIÊN LẬP ĐỊA..." />;
  if (!char) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="text-3xl opacity-20">☯</div>
      <p className="text-amber-800 text-sm">Không có dữ liệu nhân vật.</p>
    </div>
  );

  const expPct     = Math.min(100, (char.exp / char.expRequired) * 100);
  const hpPct      = Math.min(100, (char.hp / char.hpMax) * 100);
  const mpPct      = Math.min(100, (char.mp / char.mpMax) * 100);
  const staminaPct = Math.min(100, (char.stamina / char.staminaMax) * 100);
  const elColor    = ELEMENT_COLORS[char.primaryElement ?? ""] || "#c9a84c";

  const isDailyAvailable = (() => {
    if (!char.lastDailyClaimAt) return true;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    return new Date(char.lastDailyClaimAt) < todayStart;
  })();
  const needsRest = char.hp < char.hpMax || char.stamina < char.staminaMax;

  const streak      = char.loginStreak ?? 0;
  const streakDay   = isDailyAvailable ? Math.min((streak % 7) + 1, 7) : (streak === 0 ? 1 : streak);
  const todayReward = STREAK_REWARDS[(streakDay - 1) % 7];

  const passXp     = bpData?.progress?.passXp ?? 0;
  const maxPassXp  = 3200;
  const passPct    = Math.min(100, (passXp / maxPassXp) * 100);

  const stats = [
    { label: "Công Kích", value: char.atk },
    { label: "Phòng Thủ", value: char.def },
    { label: "Lực Chiến", value: char.power },
    { label: "Thần Thức", value: char.spirit },
    { label: "Tốc Độ",   value: char.speed },
    { label: "May Mắn",  value: char.luck },
  ];

  const QUICK_LINKS = [
    { path: "/dungeon",     icon: "⚔",  label: "Bí Cảnh",    color: "border-red-900/30 hover:border-red-700/50",    text: "text-red-800 group-hover:text-red-600" },
    { path: "/boss",        icon: "☠",  label: "Boss",       color: "border-orange-900/30 hover:border-orange-700/50", text: "text-orange-800 group-hover:text-orange-600" },
    { path: "/mission",     icon: "✦",  label: "Nhiệm Vụ",   color: "border-amber-900/30 hover:border-amber-700/50",  text: "text-amber-800 group-hover:text-amber-600" },
    { path: "/alchemy",     icon: "⊛",  label: "Luyện Đan",  color: "border-cyan-900/30 hover:border-cyan-700/50",   text: "text-cyan-900 group-hover:text-cyan-700" },
    { path: "/achievement", icon: "◆",  label: "Thành Tựu",  color: "border-purple-900/30 hover:border-purple-700/50", text: "text-purple-900 group-hover:text-purple-700" },
    { path: "/leaderboard", icon: "▲",  label: "Xếp Hạng",   color: "border-amber-900/30 hover:border-amber-700/50",  text: "text-amber-900 group-hover:text-amber-700" },
  ];

  async function toggleCultivation() {
    try {
      if (char.cultivating) {
        const res = await stopCult.mutateAsync() as any;
        toast.success("Xuất định thành công.");
        if (res?.completedMissions?.length) setTimeout(() => {
          for (const n of res.completedMissions) toast.success(`Nhiệm vụ hoàn thành: ${n}!`);
        }, 400);
      } else {
        const res = await startCult.mutateAsync();
        toast.success(res.message || "Bắt đầu nhập định tu luyện.");
      }
    } catch (err: any) { toast.error(err.message || "Thao tác thất bại"); }
  }

  async function claimDaily() {
    try {
      const r = await dailyReward.mutateAsync() as any;
      toast.success(r.message || "Nhận thưởng điểm danh thành công!");
      refetch();
    } catch (err: any) { toast.error(err.data?.error || err.message || "Đã nhận thưởng hôm nay rồi."); }
  }

  async function handleRest() {
    try {
      const r = await rest.mutateAsync() as any;
      toast.success(r.message);
    } catch (err: any) { toast.error(err.message || "Không thể nghỉ ngơi"); }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* ── Character + vitals ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Avatar card */}
        <Card className="p-5 flex flex-col items-center text-center">
          {/* Avatar ring */}
          <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-3 flex-shrink-0"
            style={{ borderColor: elColor, background: `${elColor}0f`, boxShadow: `0 0 24px ${elColor}33` }}>
            <span className="text-2xl font-bold" style={{ color: elColor }}>{char.name[0]}</span>
          </div>
          <h2 className="text-amber-300 font-bold text-lg leading-tight">{char.name}</h2>
          {char.title && (
            <p className="text-amber-700 text-xs border border-amber-900/30 rounded-sm px-2 py-0.5 mt-1 tracking-wider">「{char.title}」</p>
          )}
          <p className="text-amber-700 text-xs mt-1">{char.realmName}</p>
          {char.primaryElement && (
            <span className="text-xs px-2 py-0.5 rounded-sm border mt-2"
              style={{ color: elColor, borderColor: elColor + "44", background: elColor + "11" }}>
              {ELEMENT_NAMES[char.primaryElement]} · {GRADE_LABELS[char.spiritualRootGrade ?? ""] || "?"}
            </span>
          )}
          {char.skillAffinity !== undefined && (
            <span className="text-[11px] mt-2 text-amber-800">Kỹ năng +{Math.round(char.skillAffinity * 100)}%</span>
          )}

          {/* Vitals */}
          <div className="w-full mt-4 space-y-2.5">
            {[
              { label: "HP",     cur: char.hp,      max: char.hpMax,      color: "#ef4444", bg: "#3b0000", pct: hpPct },
              { label: "MP",     cur: char.mp,      max: char.mpMax,      color: "#3b82f6", bg: "#0a1930", pct: mpPct },
              { label: "Thể Lực",cur: char.stamina, max: char.staminaMax, color: "#60a5fa", bg: "#0a1930", pct: staminaPct },
              { label: "Tu Vi",  cur: char.exp,     max: char.expRequired, color: char.cultivating ? "#f59e0b" : "#92400e", bg: "#1c0a00", pct: expPct, glow: char.cultivating, animated: char.cultivating },
            ].map(v => (
              <div key={v.label}>
                <div className="flex justify-between text-xs text-amber-900 mb-1">
                  <span>{v.label}</span>
                  <span className="tabular-nums">{v.cur.toLocaleString()}/{v.max.toLocaleString()}</span>
                </div>
                <ProgressBar pct={v.pct} color={v.color} bg={v.bg} glow={v.glow} animated={v.animated} />
              </div>
            ))}
          </div>

          {/* Currency */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <div className="bg-[#0f0c06] border border-amber-900/20 rounded-sm p-2 text-center">
              <div className="text-amber-900 text-xs">Linh Thạch</div>
              <div className="text-amber-400 font-bold text-sm tabular-nums">{char.linhThach.toLocaleString()}</div>
            </div>
            <div className="bg-[#0f0c06] border border-purple-900/20 rounded-sm p-2 text-center">
              <div className="text-purple-900 text-xs">Tiên Ngọc</div>
              <div className="text-purple-400 font-bold text-sm tabular-nums">{char.tienNgoc.toLocaleString()}</div>
            </div>
          </div>
        </Card>

        {/* Stats + Cultivation */}
        <div className="md:col-span-2 space-y-3">
          {/* Combat stats */}
          <Card className="p-4">
            <CardLabel>Chỉ số chiến đấu</CardLabel>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {stats.map(s => <StatPill key={s.label} label={s.label} value={s.value.toLocaleString()} />)}
            </div>
          </Card>

          {/* Cultivation control */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <CardLabel>Tu Luyện</CardLabel>
              {char.cultivating && (
                <span className="text-xs text-emerald-500 border border-emerald-800/40 rounded-sm px-2 py-0.5 animate-pulse">Nhập Định</span>
              )}
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-amber-800 mb-1.5">
                <span>{char.realmName}</span>
                <span className="tabular-nums">{char.exp.toLocaleString()} / {char.expRequired.toLocaleString()}</span>
              </div>
              <ProgressBar pct={expPct} color={char.cultivating ? "#f59e0b" : "#92400e"} bg="#1c0a00" height="h-3" glow={char.cultivating} animated={char.cultivating} />
              <div className="flex justify-between text-xs text-amber-900 mt-1">
                <span>
                  {expPct >= 100
                    ? <span className="text-amber-400 animate-pulse">✦ Có thể đột phá!</span>
                    : `Còn ${(char.expRequired - char.exp).toLocaleString()} EXP`}
                </span>
                <span>{expPct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Btn
                variant={char.cultivating ? "red" : "green"}
                onClick={toggleCultivation}
                loading={startCult.isPending || stopCult.isPending}
                className="flex-1 py-2.5"
              >
                {char.cultivating ? "XUẤT ĐỊNH" : "BẮT ĐẦU NHẬP ĐỊNH"}
              </Btn>
              <Btn variant="gold" onClick={() => setLocation("/cultivation")} className="px-4 py-2.5">
                Đột Phá
              </Btn>
            </div>
          </Card>

          {/* Rest */}
          <Card className={`p-3 flex items-center justify-between gap-3 ${needsRest && restCooldown === 0 ? "border-blue-900/30" : "opacity-55"}`}>
            <div className="min-w-0">
              <div className="text-blue-300 text-xs font-medium">Nghỉ Ngơi Hồi Phục</div>
              <div className="text-amber-900 text-xs mt-0.5 truncate">
                {restCooldown > 0 ? `Hồi chiêu ${restCooldown}s` : needsRest ? "+40% HP · +30 Thể Lực" : "HP và thể lực đang đầy"}
              </div>
            </div>
            <Btn
              variant="blue"
              onClick={handleRest}
              disabled={restCooldown > 0 || !needsRest}
              loading={rest.isPending}
              className="px-4 py-2 flex-shrink-0"
            >
              {restCooldown > 0 ? `CD ${restCooldown}s` : "NGHỈ"}
            </Btn>
          </Card>
        </div>
      </div>

      {/* ── Daily Streak ──────────────────────────────────────────── */}
      <Card className={`p-4 mb-4 ${isDailyAvailable ? "border-amber-600/40" : "border-amber-900/15 opacity-60"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardLabel>Điểm Danh Hàng Ngày</CardLabel>
              {streak > 0 && (
                <span className="text-xs text-amber-600 border border-amber-800/40 rounded-sm px-1.5 py-0.5">
                  Ngày {streak % 7 === 0 && !isDailyAvailable ? 7 : streak % 7 || (streak > 0 ? 7 : 1)}/7
                </span>
              )}
            </div>
            {/* Streak progress */}
            <div className="flex gap-1 mb-2">
              {STREAK_REWARDS.map((r, i) => {
                const dayNum = i + 1;
                const done = !isDailyAvailable && streak > 0
                  ? dayNum <= (streak % 7 === 0 ? 7 : streak % 7)
                  : dayNum < (streak % 7 === 0 ? 7 : streak % 7) + (isDailyAvailable ? 0 : 1);
                const isToday = isDailyAvailable && dayNum === streakDay;
                return (
                  <div key={dayNum} title={`Ngày ${dayNum}: +${r.ls} LS${r.item ? " + " + r.item : ""}`}
                    className={`flex-1 flex flex-col items-center gap-0.5 p-1 rounded-sm border text-center transition-all ${
                      done ? "border-amber-700/40 bg-amber-900/20" :
                      isToday ? "border-amber-500/60 bg-amber-900/25 shadow-[0_0_8px_#d97706aa]" :
                      "border-amber-900/15 bg-[#0f0c06]"
                    }`}>
                    <div className={`text-xs font-bold ${done ? "text-amber-600" : isToday ? "text-amber-400" : "text-amber-900"}`}>
                      {done ? "✓" : dayNum}
                    </div>
                    <div className={`text-xs leading-none ${done ? "text-amber-700" : isToday ? "text-amber-500" : "text-amber-900"}`}>
                      {r.ls}
                    </div>
                    {r.item && <div className="w-1 h-1 rounded-full bg-emerald-700 mx-auto" title={r.item} />}
                  </div>
                );
              })}
            </div>
            <div className="text-amber-900 text-xs">
              {isDailyAvailable
                ? `Hôm nay: +${todayReward.ls} Linh Thạch${todayReward.item ? " + " + todayReward.item : ""}`
                : "Quay lại sau 0:00 để nhận thưởng ngày tiếp theo"}
            </div>
          </div>
          <Btn
            variant="gold"
            onClick={claimDaily}
            disabled={!isDailyAvailable}
            loading={dailyReward.isPending}
            className={`flex-shrink-0 px-5 py-2.5 ${isDailyAvailable ? "animate-pulse" : ""}`}
          >
            {isDailyAvailable ? "NHẬN" : "✓"}
          </Btn>
        </div>
      </Card>

      {/* ── Battle Pass mini ────────────────────────────────────────── */}
      {bpData?.season && (
        <Card className="p-4 mb-4 border-amber-900/20">
          <div className="flex items-center justify-between mb-2">
            <CardLabel>Battle Pass — {bpData.season.name}</CardLabel>
            <button onClick={() => setLocation("/battle-pass")} className="text-xs text-amber-800 hover:text-amber-600 transition-colors">Xem chi tiết →</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar pct={passPct} color="#d97706" bg="#1c0a00" height="h-2" />
            </div>
            <span className="text-amber-700 text-xs tabular-nums flex-shrink-0">{passXp.toLocaleString()} / {maxPassXp.toLocaleString()} XP</span>
          </div>
          {(() => {
            const claimed = (bpData.progress?.claimedTiers ?? []) as number[];
            const tiers = (bpData.season.tiers ?? []) as any[];
            const nextTier = tiers.find((t: any) => !claimed.includes(t.tier) && passXp >= t.xpRequired);
            if (nextTier) return (
              <p className="text-emerald-700 text-xs mt-1">✦ Tier {nextTier.tier} có thể nhận! <button onClick={() => setLocation("/battle-pass")} className="underline">Nhận ngay</button></p>
            );
            const upcoming = tiers.find((t: any) => !claimed.includes(t.tier) && passXp < t.xpRequired);
            if (upcoming) return (
              <p className="text-amber-900 text-xs mt-1">Cần thêm {(upcoming.xpRequired - passXp).toLocaleString()} Pass XP cho Tier {upcoming.tier}</p>
            );
            return null;
          })()}
        </Card>
      )}

      {/* ── Quick links ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {QUICK_LINKS.map(q => (
          <button key={q.path} onClick={() => setLocation(q.path)}
            className={`bg-[#120e08] border rounded-sm p-3 text-center hover:bg-[#1a1208] transition-all group ${q.color}`}>
            <div className="text-xl mb-1">{q.icon}</div>
            <div className={`text-xs transition-all ${q.text}`}>{q.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
