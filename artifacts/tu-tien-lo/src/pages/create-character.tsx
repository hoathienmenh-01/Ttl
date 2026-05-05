import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { ELEMENT_NAMES, GRADE_LABELS, ELEMENT_COLORS } from "@/lib/constants";

const schema = z.object({ name: z.string().min(2, "Tối thiểu 2 ký tự").max(20, "Tối đa 20 ký tự") });
type Form = z.infer<typeof schema>;

interface CharResult {
  name: string;
  realmName: string;
  primaryElement: string;
  spiritualRootGrade: string;
  skillAffinity?: number;
}

export default function CreateCharacterPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CharResult | null>(null);
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setLoading(true);
    try {
      const res = await apiPost("/character", data);
      setResult(res);
      qc.invalidateQueries({ queryKey: ["character"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err: any) {
      toast.error(err.message || "Tạo nhân vật thất bại");
    } finally {
      setLoading(false);
    }
  }

  const gradeColors: Record<string, string> = {
    common: "#94a3b8", good: "#22c55e", rare: "#38bdf8", epic: "#a855f7",
  };

  if (result) {
    const elColor = ELEMENT_COLORS[result.primaryElement] || "#c9a84c";
    const grColor = gradeColors[result.spiritualRootGrade] || "#94a3b8";
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0805]">
        <div className="max-w-lg w-full px-6 text-center">
          <div className="bg-[#120e08] border border-amber-900/40 rounded-sm p-10 shadow-2xl">
            <div className="text-amber-700 text-xs tracking-widest mb-4">LINH CĂN GIÁM ĐỊNH</div>
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border-2"
              style={{ borderColor: elColor, background: `${elColor}22`, boxShadow: `0 0 30px ${elColor}66` }}>
              <span className="text-2xl font-bold" style={{ color: elColor }}>{ELEMENT_NAMES[result.primaryElement]?.[0] ?? "?"}</span>
            </div>
            <h2 className="text-3xl font-bold text-amber-300 mb-2" style={{ textShadow: "0 0 20px #c9a84c88" }}>
              {result.name}
            </h2>
            <p className="text-amber-700 text-sm mb-6">{result.realmName}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#1a1208] rounded-sm p-4 border border-amber-900/20">
                <div className="text-amber-800 text-xs tracking-widest mb-1">NGŨ HÀNH</div>
                <div className="text-lg font-bold" style={{ color: elColor }}>{ELEMENT_NAMES[result.primaryElement] || result.primaryElement}</div>
              </div>
              <div className="bg-[#1a1208] rounded-sm p-4 border border-amber-900/20">
                <div className="text-amber-800 text-xs tracking-widest mb-1">LINH CĂN</div>
                <div className="text-lg font-bold" style={{ color: grColor }}>{GRADE_LABELS[result.spiritualRootGrade] || result.spiritualRootGrade}</div>
              </div>
            </div>
            <div className="bg-amber-900/10 border border-amber-900/20 rounded-sm p-4 mb-8 text-amber-700 text-sm">
              {result.spiritualRootGrade === "epic" && "Linh căn phi phàm! Thiên tài trăm năm có một, tiền đồ vô lượng!"}
              {result.spiritualRootGrade === "rare" && "Linh căn xuất chúng! Con đường tu tiên rộng mở trước mắt."}
              {result.spiritualRootGrade === "good" && "Linh căn tốt, nỗ lực tu luyện sẽ đến đỉnh cao."}
              {result.spiritualRootGrade === "common" && "Linh căn bình thường, nhưng ý chí là vô hạn. Hãy bền chí!"}
            </div>
            <div className="bg-[#1a1208] border border-amber-900/20 rounded-sm p-3 mb-8 text-amber-800 text-xs">
              Pháp hệ tương ứng tăng nhẹ hiệu quả kỹ năng: {Math.round((result.skillAffinity ?? 0) * 100)}%.
            </div>
            <button
              onClick={() => setLocation("/")}
              className="w-full py-3 bg-gradient-to-r from-amber-900 to-amber-700 hover:from-amber-800 hover:to-amber-600 text-amber-200 font-medium tracking-widest text-sm rounded-sm transition-all border border-amber-700/50"
              style={{ boxShadow: "0 0 20px #c9a84c22" }}
            >
              BẮT ĐẦU HÀNH TRÌNH
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0805]">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 tracking-widest" style={{ textShadow: "0 0 30px #c9a84c88" }}>TẠO NHÂN VẬT</h1>
          <p className="text-amber-800 text-sm mt-2">Đặt đạo hiệu cho tiên nhân của bạn</p>
        </div>
        <div className="bg-[#120e08] border border-amber-900/40 rounded-sm p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-amber-700 text-xs tracking-widest mb-2">ĐẠO DANH TIÊN NHÂN</label>
              <input
                {...register("name")}
                placeholder="Tên nhân vật (2-20 ký tự)"
                className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors text-sm"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="bg-amber-900/10 border border-amber-900/20 rounded-sm p-4 text-amber-800 text-xs">
              Sau khi đặt tên, hệ thống sẽ tự động giám định linh căn của bạn. Linh căn quyết định nguyên tố tu luyện và tiềm năng.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-900 to-amber-700 hover:from-amber-800 hover:to-amber-600 text-amber-200 font-medium tracking-widest text-sm rounded-sm transition-all disabled:opacity-50 border border-amber-700/50"
            >
              {loading ? "ĐANG GIÁM ĐỊNH LINH CĂN..." : "GIÁM ĐỊNH LINH CĂN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
