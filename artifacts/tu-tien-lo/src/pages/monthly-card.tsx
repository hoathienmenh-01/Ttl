import { toast } from "sonner";
import { useCharacter, useActivateMonthlyCard } from "@/lib/hooks";

const BENEFITS = [
  { icon: "◆", label: "Điểm Danh Nhận 200 LS/ngày", detail: "Thay vì 100 LS thông thường — x2 phần thưởng điểm danh", highlight: true },
  { icon: "⊙", label: "Thể Lực Hồi Nhanh Hơn", detail: "+10% tốc độ hồi Thể Lực mỗi 30 phút", highlight: false },
  { icon: "◈", label: "Danh Hiệu Đặc Biệt", detail: "Hiển thị danh hiệu \"Nguyệt Dạ Tu Sĩ\" trên nhân vật", highlight: false },
  { icon: "✦", label: "Thông Tin Kinh Tế", detail: "Xem lịch sử giao dịch chi tiết của nhân vật", highlight: false },
];

export default function MonthlyCardPage() {
  const { data: char } = useCharacter();
  const activate = useActivateMonthlyCard();

  const isActive = char?.monthlyCardActive;
  const expiresAt = char?.monthlyCardExpiresAt ? new Date(char.monthlyCardExpiresAt) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : 0;

  async function handleActivate() {
    try {
      const r = await activate.mutateAsync();
      toast.success((r as any).message || "Kích hoạt thành công!");
    } catch (e: any) {
      toast.error(e.message || "Không thể kích hoạt");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-amber-400 font-bold tracking-widest text-lg">NGUYỆT ĐẠO THẺ</h1>
        <div className="text-amber-800 text-xs mt-0.5">Thẻ tu luyện hàng tháng — tiện lợi không áp đảo</div>
      </div>

      {isActive ? (
        <div className="mb-6 border border-emerald-800/50 bg-emerald-950/20 rounded-sm p-4 flex items-center gap-4">
          <div className="text-emerald-500 text-2xl">◆</div>
          <div>
            <div className="text-emerald-400 font-medium">Thẻ Đang Hoạt Động</div>
            <div className="text-emerald-700 text-xs mt-0.5">
              Còn <span className="text-emerald-500 font-bold">{daysLeft}</span> ngày •{" "}
              Hết hạn {expiresAt?.toLocaleDateString("vi-VN") ?? "—"}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 border border-amber-900/30 bg-[#0f0c06] rounded-sm p-4 flex items-center gap-4">
          <div className="text-amber-800 text-2xl">◇</div>
          <div>
            <div className="text-amber-700 font-medium">Chưa Kích Hoạt</div>
            <div className="text-amber-900 text-xs mt-0.5">Kích hoạt bằng 30 Tiên Ngọc để nhận đặc quyền 30 ngày</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="text-amber-700 text-xs tracking-widest mb-3">ĐẶC QUYỀN NGUYỆT ĐẠO THẺ</div>
        <div className="space-y-2">
          {BENEFITS.map(b => (
            <div key={b.label} className={`border rounded-sm p-4 flex items-start gap-3 ${
              b.highlight ? "border-amber-700/50 bg-amber-900/10" : "border-amber-900/20 bg-[#0f0c06]"
            }`}>
              <span className={`text-lg flex-shrink-0 ${b.highlight ? "text-amber-500" : "text-amber-800"}`}>{b.icon}</span>
              <div>
                <div className={`text-sm font-medium ${b.highlight ? "text-amber-300" : "text-amber-600"}`}>{b.label}</div>
                <div className="text-amber-800 text-xs mt-0.5">{b.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-amber-900/20 rounded-sm p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-amber-400 text-xl font-bold">30 Tiên Ngọc</div>
            <div className="text-amber-800 text-xs">= 30 ngày đặc quyền</div>
          </div>
          <div className="text-right">
            <div className="text-amber-800 text-xs mb-1">Tiên Ngọc hiện có</div>
            <div className="text-purple-400 font-bold">{char?.tienNgoc ?? 0} TN</div>
          </div>
        </div>

        <div className="mt-4">
          {isActive ? (
            <button
              onClick={handleActivate}
              disabled={activate.isPending || (char?.tienNgoc ?? 0) < 30}
              className="w-full py-2.5 text-sm border border-emerald-700/60 text-emerald-600 hover:text-emerald-400 hover:border-emerald-600 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activate.isPending ? "Đang xử lý..." : "Gia Hạn Thêm 30 Ngày"}
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={activate.isPending || (char?.tienNgoc ?? 0) < 30}
              className="w-full py-2.5 text-sm border border-amber-700/60 text-amber-500 hover:text-amber-300 hover:border-amber-600 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activate.isPending ? "Đang kích hoạt..." : (char?.tienNgoc ?? 0) < 30 ? "Không đủ Tiên Ngọc" : "Kích Hoạt Nguyệt Đạo Thẻ"}
            </button>
          )}
        </div>
      </div>

      <div className="text-amber-900 text-xs leading-relaxed border-t border-amber-900/20 pt-4">
        <div className="text-amber-700 text-xs tracking-widest mb-2">NGUYÊN TẮC THƯƠNG MẠI</div>
        <div>• Không bán cảnh giới, EXP, hoặc sức mạnh chiến đấu trực tiếp.</div>
        <div>• Nguyệt Đạo Thẻ chỉ cung cấp tiện lợi — mọi nội dung đều có thể đạt được miễn phí.</div>
        <div>• Tu Tiên Lộ cam kết không làm mất cân bằng gameplay.</div>
      </div>
    </div>
  );
}
