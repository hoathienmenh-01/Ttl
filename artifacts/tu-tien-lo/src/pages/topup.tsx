import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTopupHistory, useRequestTopup } from "@/lib/hooks";
import { useMe } from "@/lib/hooks";

const schema = z.object({
  amount: z.number({ invalid_type_error: "Nhập số tiền" }).int().min(10000, "Tối thiểu 10,000 VND"),
});
type Form = z.infer<typeof schema>;

const STATUS_LABELS: Record<string, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
const STATUS_COLORS: Record<string, string> = { pending: "text-amber-600", approved: "text-emerald-500", rejected: "text-red-500" };

function genCode(username: string) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MTT-${username.slice(0, 6).toUpperCase()}-${rand}`;
}

export default function TopupPage() {
  const { data: me } = useMe();
  const { data: history, isLoading } = useTopupHistory();
  const requestTopup = useRequestTopup();
  const [transferCode] = useState(() => genCode(me?.username || "USER"));
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 50000 },
  });

  const amount = watch("amount");
  const tienNgoc = Math.floor((amount || 0) / 10000);

  async function onSubmit(data: Form) {
    try {
      await requestTopup.mutateAsync({ amount: data.amount, transferCode });
      toast.success("Yêu cầu nạp tiền đã gửi. Chờ admin xác nhận.");
      reset();
    } catch (err: any) {
      toast.error(err.message || "Gửi yêu cầu thất bại");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-amber-500 font-bold tracking-widest mb-6 text-lg">NẠP TIỀN</h1>

      <div className="bg-[#120e08] border border-amber-900/30 rounded-sm p-6 mb-6">
        <h2 className="text-amber-700 text-xs tracking-widest mb-4">THÔNG TIN CHUYỂN KHOẢN</h2>
        <div className="space-y-3 text-sm mb-6">
          <div className="flex justify-between"><span className="text-amber-800">Ngân hàng:</span><span className="text-amber-300">Vietcombank / MB Bank</span></div>
          <div className="flex justify-between"><span className="text-amber-800">Số tài khoản:</span><span className="text-amber-300">0123456789</span></div>
          <div className="flex justify-between"><span className="text-amber-800">Chủ tài khoản:</span><span className="text-amber-300">NGUYEN VAN ADMIN</span></div>
        </div>
        <div className="bg-amber-900/10 border border-amber-800/30 rounded-sm p-4 mb-6">
          <div className="text-amber-800 text-xs mb-2">MÃ CHUYỂN KHOẢN (bắt buộc ghi vào nội dung):</div>
          <div className="text-amber-400 font-bold text-lg tracking-widest font-mono">{transferCode}</div>
          <div className="text-amber-900 text-xs mt-1">Ghi đúng mã này vào nội dung chuyển khoản để được xác nhận tự động.</div>
        </div>

        <div className="text-xs text-amber-800 mb-1">TỶ GIÁ: 10,000 VND = 1 Tiên Ngọc</div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-amber-700 text-xs tracking-widest mb-2">SỐ TIỀN (VND)</label>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              step="10000"
              min="10000"
              className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 focus:outline-none focus:border-amber-600 text-sm"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          {tienNgoc > 0 && (
            <div className="text-xs text-purple-400">Nhận được: {tienNgoc} Tiên Ngọc</div>
          )}
          <button
            type="submit"
            disabled={requestTopup.isPending}
            className="w-full py-3 bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-800/40 text-purple-300 text-sm tracking-widest rounded-sm hover:from-purple-900/60 hover:to-purple-800/60 transition-all disabled:opacity-50"
          >
            {requestTopup.isPending ? "ĐANG GỬI..." : "XÁC NHẬN ĐÃ CHUYỂN KHOẢN"}
          </button>
        </form>
      </div>

      {/* History */}
      <h2 className="text-amber-700 text-xs tracking-widest mb-4">LỊCH SỬ NẠP TIỀN</h2>
      {isLoading ? (
        <div className="text-amber-800 text-center py-8">Đang tải...</div>
      ) : !history?.length ? (
        <div className="text-amber-900 text-center py-8">Chưa có lịch sử nạp tiền.</div>
      ) : (
        <div className="space-y-2">
          {history.map((h: any) => (
            <div key={h.id} className="bg-[#120e08] border border-amber-900/20 rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-300 font-medium">{h.amount.toLocaleString()} VND</span>
                <span className={`text-xs ${STATUS_COLORS[h.status] || "text-amber-800"}`}>{STATUS_LABELS[h.status] || h.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-800">
                <span>+{h.tienNgocGranted} Tiên Ngọc</span>
                <span>{new Date(h.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="text-xs text-amber-900 font-mono mt-1">{h.transferCode}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
