import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiPost, setToken, getToken } from "@/lib/api";
import { PROVERBS } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  username: z.string().min(3, "Tối thiểu 3 ký tự").max(20, "Tối đa 20 ký tự"),
  password: z.string().min(8, "Tối thiểu 8 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const proverb = PROVERBS[Math.floor(Math.random() * PROVERBS.length)];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) setLocation("/");
  }, []);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function handleLogin(data: LoginForm) {
    setLoading(true);
    try {
      const res = await apiPost("/auth/login", data);
      setToken(res.token);
      toast.success("Chào mừng trở lại, đạo hữu!");
      setLocation(res.user.hasCharacter ? "/" : "/create-character");
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(data: RegisterForm) {
    setLoading(true);
    try {
      const res = await apiPost("/auth/register", data);
      setToken(res.token);
      toast.success("Khai tông lập danh thành công!");
      setLocation("/create-character");
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0805] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1208_0%,_#0a0805_70%)]" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-amber-400 mb-2 tracking-widest" style={{ fontFamily: "serif", textShadow: "0 0 30px #c9a84c88" }}>
            Tu Tiên Lộ
          </h1>
          <p className="text-amber-700 text-sm tracking-[0.3em] uppercase">Đạo Môn</p>
          <div className="mt-4 mx-auto w-32 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent" />
          <p className="mt-4 text-amber-800 text-xs italic px-4">{proverb}</p>
        </div>

        {/* Card */}
        <div className="bg-[#120e08] border border-amber-900/40 rounded-sm shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-amber-900/30">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3 text-sm tracking-widest transition-all ${tab === "login" ? "text-amber-400 bg-amber-900/20 border-b-2 border-amber-500" : "text-amber-800 hover:text-amber-600"}`}
            >
              NHẬP ĐẠO
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-3 text-sm tracking-widest transition-all ${tab === "register" ? "text-amber-400 bg-amber-900/20 border-b-2 border-amber-500" : "text-amber-800 hover:text-amber-600"}`}
            >
              KHAI TÔNG
            </button>
          </div>

          <div className="p-8">
            {tab === "login" ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <div>
                  <label className="block text-amber-700 text-xs tracking-widest mb-2">TÀI KHOẢN</label>
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="Email đạo đồ"
                    className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors text-sm"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-amber-700 text-xs tracking-widest mb-2">HUYỀN PHÁP BẢO HỘ</label>
                  <input
                    {...loginForm.register("password")}
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors text-sm"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-900 to-amber-700 hover:from-amber-800 hover:to-amber-600 text-amber-200 font-medium tracking-widest text-sm rounded-sm transition-all disabled:opacity-50 border border-amber-700/50"
                  style={{ boxShadow: "0 0 20px #c9a84c22" }}
                >
                  {loading ? "ĐANG NHẬP ĐỊNH..." : "NHẬP ĐỊNH TU HÀNH"}
                </button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5">
                <div>
                  <label className="block text-amber-700 text-xs tracking-widest mb-2">ĐẠO HIỆU</label>
                  <input
                    {...registerForm.register("username")}
                    placeholder="Tên đạo hiệu (3-20 ký tự)"
                    className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors text-sm"
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-amber-700 text-xs tracking-widest mb-2">TÀI KHOẢN</label>
                  <input
                    {...registerForm.register("email")}
                    type="email"
                    placeholder="Email"
                    className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors text-sm"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-amber-700 text-xs tracking-widest mb-2">HUYỀN PHÁP BẢO HỘ</label>
                  <input
                    {...registerForm.register("password")}
                    type="password"
                    placeholder="Mật khẩu (ít nhất 8 ký tự)"
                    className="w-full bg-[#1a1208] border border-amber-900/40 rounded-sm px-4 py-3 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors text-sm"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-900 to-emerald-700 hover:from-emerald-800 hover:to-emerald-600 text-emerald-200 font-medium tracking-widest text-sm rounded-sm transition-all disabled:opacity-50 border border-emerald-700/50"
                  style={{ boxShadow: "0 0 20px #22c55e22" }}
                >
                  {loading ? "ĐANG KHAI TÔNG..." : "KHAI TÔNG LẬP DANH"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-amber-900 text-xs mt-6 tracking-widest">
          Version 1.0 — Năm Bính Ngọ
        </p>
      </div>
    </div>
  );
}
