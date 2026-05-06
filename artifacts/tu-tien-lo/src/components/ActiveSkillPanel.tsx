import { Link } from "wouter";
import { ELEMENT_COLORS, ELEMENT_NAMES } from "@/lib/constants";

interface ActiveSkill {
  id: string;
  skillId: string;
  name: string;
  element: string;
  type: string;
  mpCost: number;
  cooldownSeconds: number;
  damageMultiplier: number;
  activeSlot: number | null;
}

interface ActiveSkillPanelProps {
  skills: ActiveSkill[] | undefined;
  isLoading: boolean;
}

export function ActiveSkillPanel({ skills, isLoading }: ActiveSkillPanelProps) {
  const activeSkills: Record<number, ActiveSkill> = {};
  if (skills) {
    for (const skill of skills) {
      if (skill.activeSlot && [1, 2, 3].includes(skill.activeSlot)) {
        activeSkills[skill.activeSlot] = skill;
      }
    }
  }

  const hasAnyActive = Object.keys(activeSkills).length > 0;

  return (
    <div className="mb-4 rounded-sm border border-amber-900/30 bg-amber-950/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-700">⚡</span>
        <h3 className="text-amber-400 font-bold text-xs tracking-widest">KỸ NĂNG ACTIVE</h3>
      </div>

      {isLoading ? (
        <div className="text-amber-800 text-xs text-center py-4">Đang tải...</div>
      ) : !hasAnyActive ? (
        <div className="rounded-sm border border-amber-900/40 bg-amber-950/20 px-3 py-2.5 text-xs text-amber-700">
          <div className="mb-2">⚠ Chưa có kỹ năng chủ động được chọn</div>
          <div className="text-amber-800 mb-2">
            Hãy đi đến trang <Link href="/skill" className="text-amber-500 hover:text-amber-400 underline">Pháp Thuật</Link> để trang bị 3 kỹ năng chủ động.
          </div>
          <div className="text-amber-900 text-xs italic">Kỹ năng chủ động được sử dụng ưu tiên trong chiến đấu và có thể thay đổi kết quả trận đấu.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[1, 2, 3].map((slot) => {
            const skill = activeSkills[slot];
            if (!skill) {
              return (
                <div key={slot} className="border border-amber-900/20 rounded-sm p-2.5 bg-amber-950/5 text-center">
                  <div className="text-amber-900 text-xs">Ô {slot}</div>
                  <div className="text-amber-950 text-xs mt-1">Trống</div>
                </div>
              );
            }

            const elColor = ELEMENT_COLORS[skill.element] ?? "#78350f";

            return (
              <div
                key={skill.id}
                className="border rounded-sm p-2.5"
                style={{
                  borderColor: `${elColor}40`,
                  backgroundColor: `${elColor}0a`,
                }}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate" style={{ color: elColor }}>
                      {skill.name}
                    </div>
                    <div className="text-amber-900 text-xs">Ô {slot}</div>
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-sm whitespace-nowrap flex-shrink-0 border"
                    style={{
                      color: elColor,
                      borderColor: `${elColor}33`,
                      background: `${elColor}0d`,
                    }}
                  >
                    {ELEMENT_NAMES[skill.element] || skill.element}
                  </span>
                </div>

                <div className="space-y-0.5 text-xs text-amber-800">
                  <div>
                    <span className="text-amber-900">MP:</span> {skill.mpCost}
                  </div>
                  {skill.cooldownSeconds > 0 && (
                    <div>
                      <span className="text-amber-900">CD:</span> {skill.cooldownSeconds}s
                    </div>
                  )}
                  {skill.damageMultiplier > 1 && (
                    <div>
                      <span className="text-amber-900">Sát thương:</span> ×{skill.damageMultiplier.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-xs text-amber-900 italic">
        Chú ý: Tất cả tính toán chiến đấu được thực hiện trên máy chủ. Kỹ năng chủ động không thay đổi UI ở đây nhưng ảnh hưởng đến kết quả chiến đấu.
      </div>
    </div>
  );
}
