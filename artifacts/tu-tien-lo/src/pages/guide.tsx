import { useCharacter } from "@/lib/hooks";
import { ELEMENT_NAMES, ELEMENT_COLORS, GRADE_LABELS } from "@/lib/constants";

const sections = [
  {
    title: "Chào mừng đến Hoa Thiên Môn",
    icon: "☯",
    content: `Ngươi là một phàm nhân vừa được Hoa Thiên Môn thu nhận làm ngoại môn đệ tử. Tông môn từng là đại đạo thống cổ xưa, nay suy tàn sau Thượng Cổ Đại Kiếp. Con đường tu tiên dài vô tận — hãy bước từng bước vững chắc.`,
  },
  {
    title: "Vòng Lặp Cốt Lõi",
    icon: "◈",
    steps: [
      "Tu Luyện → tích lũy EXP theo thời gian (có linh căn bonus)",
      "Đột Phá → dùng EXP + Linh Thạch để lên cảnh giới cao hơn",
      "Bí Cảnh → chiến đấu với yêu thú, nhận EXP & vật phẩm (tiêu thể lực)",
      "Nhiệm Vụ → hoàn thành quest hàng ngày và NPC để nhận thưởng lớn",
      "Pháp Thuật → học pháp thuật tăng sức mạnh trong bí cảnh",
      "Nghỉ Ngơi → hồi HP và thể lực khi cần chiến đấu tiếp",
    ],
  },
  {
    title: "Tu Luyện & Đột Phá",
    icon: "✧",
    content: `Vào trang Tu Luyện và bấm "Bắt đầu nhập định". EXP sẽ tự tích lũy theo thời gian — server tính toán, không cần mở tab. Linh căn của ngươi quyết định tốc độ nhận EXP (Bình Thường → Sử Tài → Thiên Tài → Thiên Phú). Khi đủ EXP và Linh Thạch, bấm "Đột Phá" để lên cảnh giới.`,
  },
  {
    title: "Ngũ Hành Tương Khắc",
    icon: "⬡",
    table: [
      { atk: "Kim ⚔ Mộc", result: "+30% sát thương" },
      { atk: "Mộc ⚔ Thổ", result: "+30% sát thương" },
      { atk: "Thổ ⚔ Thủy", result: "+30% sát thương" },
      { atk: "Thủy ⚔ Hỏa", result: "+30% sát thương" },
      { atk: "Hỏa ⚔ Kim", result: "+30% sát thương" },
    ],
    content: `Khi vào bí cảnh, hệ ngũ hành của ngươi so với hệ bí cảnh quyết định sát thương. Tương khắc: +30%. Bị khắc: -25%. Hãy chọn bí cảnh phù hợp hệ của mình.`,
  },
  {
    title: "Bí Cảnh (Dungeon)",
    icon: "⚔",
    steps: [
      "Mỗi lần vào bí cảnh tiêu hao thể lực (Dễ: 6, TB: 10, Khó: 16)",
      "Server tính toàn bộ chiến đấu — không thể hack kết quả",
      "Chiến thắng nhận EXP, Linh Thạch, và có thể rơi vật phẩm",
      "Thất bại không mất gì ngoài thể lực đã tiêu",
      "Dùng lệnh Nghỉ Ngơi để hồi thể lực và HP",
      "Pháp thuật cùng hệ ngũ hành với bí cảnh sẽ cho bonus sát thương",
    ],
  },
  {
    title: "Nhiệm Vụ Hàng Ngày",
    icon: "✦",
    content: `Nhiệm vụ kiếm tích (Grind) tự động reset mỗi ngày. Hãy hoàn thành hàng ngày để nhận EXP và Linh Thạch đều đặn. Nhiệm vụ chính (Main) và NPC chỉ hoàn thành một lần và cho thưởng lớn hơn.`,
  },
  {
    title: "Kinh Tế & Linh Thạch",
    icon: "◉",
    steps: [
      "Linh Thạch là tiền tệ chính — dùng để đột phá, mua vật phẩm",
      "Kiếm từ: nhiệm vụ, bí cảnh, bán vật phẩm tại phiên chợ",
      "Nạp tiền trong tương lai chỉ hỗ trợ tiện ích, không phá cân bằng",
      "Linh Thạch không thể âm — server kiểm tra mọi giao dịch",
    ],
  },
  {
    title: "Mẹo Cho Người Mới",
    icon: "◆",
    steps: [
      "Bắt đầu bằng cách hoàn thành nhiệm vụ từ Mộc Thanh Y (tutorial)",
      "Luôn tu luyện khi không online — EXP tự tích lũy offline",
      "Vào bí cảnh Thanh Khê Cốc (Mộc hệ) để farm EXP sớm",
      "Học pháp thuật cùng hệ với mình để chiến đấu hiệu quả hơn",
      "Tham gia Hoa Thiên Môn để nhận nhiệm vụ tông môn hàng ngày",
      "Nghỉ ngơi trước khi vào bí cảnh khó để đảm bảo HP đầy",
    ],
  },
];

const REALM_TIERS = [
  { name: "Phàm Nhân", desc: "Khởi đầu của mọi con đường", color: "#78716c" },
  { name: "Luyện Khí", desc: "Bắt đầu cảm nhận linh khí", color: "#a16207", ls: 50 },
  { name: "Trúc Cơ", desc: "Đặt nền móng tu tiên", color: "#4d7c0f", ls: 200 },
  { name: "Kim Đan", desc: "Ngưng tụ kim đan trong đan điền", color: "#b45309", ls: 800 },
  { name: "Nguyên Anh", desc: "Nguyên anh thoát thể, trường sinh bất lão", color: "#7c3aed", ls: 2000 },
];

export default function GuidePage() {
  const { data: char } = useCharacter({ refetchInterval: 8000 });
  const rootGradeLabel = char?.spiritualRootGrade
    ? (GRADE_LABELS[char.spiritualRootGrade] ?? char.spiritualRootGrade)
    : null;
  const elColor = char?.primaryElement ? ELEMENT_COLORS[char.primaryElement] ?? "#c9a84c" : "#c9a84c";

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-amber-500 font-bold tracking-widest text-lg">HƯỚNG DẪN TU TIÊN</h1>
        <span className="text-amber-900 text-xs border border-amber-900/30 px-2 py-0.5 rounded-sm">Tân Thủ</span>
      </div>

      {char && (
        <div className="bg-[#120e08] border border-amber-900/20 rounded-sm p-4 flex flex-wrap gap-4 text-sm">
          <div>
            <div className="text-amber-900 text-xs mb-0.5">Đạo Hữu</div>
            <div className="text-amber-300 font-medium">{char.name}</div>
          </div>
          <div>
            <div className="text-amber-900 text-xs mb-0.5">Cảnh Giới</div>
            <div className="text-amber-400">{char.realmName}</div>
          </div>
          {char.primaryElement && (
            <div>
              <div className="text-amber-900 text-xs mb-0.5">Ngũ Hành</div>
              <div style={{ color: elColor }}>{ELEMENT_NAMES[char.primaryElement] ?? char.primaryElement} hệ</div>
            </div>
          )}
          {rootGradeLabel && (
            <div>
              <div className="text-amber-900 text-xs mb-0.5">Linh Căn</div>
              <div className="text-amber-400">{rootGradeLabel}</div>
            </div>
          )}
        </div>
      )}

      {sections.map(s => (
        <div key={s.title} className="bg-[#120e08] border border-amber-900/20 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600">{s.icon}</span>
            <h2 className="text-amber-400 font-medium text-sm tracking-wide">{s.title}</h2>
          </div>
          {s.content && <p className="text-amber-800 text-xs leading-relaxed">{s.content}</p>}
          {s.steps && (
            <ul className="space-y-1.5">
              {s.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <span className="text-amber-700 flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}
          {s.table && (
            <div className="space-y-1 mt-2">
              {s.table.map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-amber-700 w-32 flex-shrink-0">{row.atk}</span>
                  <span className="text-emerald-700">{row.result}</span>
                </div>
              ))}
              <p className="text-amber-800 text-xs mt-2 leading-relaxed">{s.content}</p>
            </div>
          )}
        </div>
      ))}

      <div className="bg-[#120e08] border border-amber-900/20 rounded-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-600">◈</span>
          <h2 className="text-amber-400 font-medium text-sm tracking-wide">Lộ Trình Cảnh Giới MVP</h2>
        </div>
        <div className="space-y-2">
          {REALM_TIERS.map((r, i) => (
            <div key={r.name} className="flex items-center gap-3 text-xs">
              <span className="w-5 text-amber-900 flex-shrink-0">{i + 1}.</span>
              <span className="w-24 flex-shrink-0 font-medium" style={{ color: r.color }}>{r.name}</span>
              <span className="text-amber-900 flex-1">{r.desc}</span>
              {r.ls !== undefined && (
                <span className="text-amber-800 flex-shrink-0">LS: {r.ls}</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-amber-900 text-xs mt-3">Mỗi cảnh giới có 9 trọng. Cần EXP + Linh Thạch để đột phá.</p>
      </div>
    </div>
  );
}
