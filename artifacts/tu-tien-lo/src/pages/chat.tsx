import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useChatMessages, useSendMessage } from "@/lib/hooks";
import { CHAT_CHANNELS } from "@/lib/constants";

export default function ChatPage() {
  const [channel, setChannel] = useState("world");
  const [input, setInput] = useState("");
  const { data: messages } = useChatMessages(channel);
  const send = useSendMessage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await send.mutateAsync({ channel, content: input.trim() });
      setInput("");
    } catch (err: any) {
      toast.error(err.message || "Gửi tin thất bại");
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <h1 className="text-amber-500 font-bold tracking-widest mb-4 text-lg flex-shrink-0">GIAO LƯU</h1>

      {/* Channel tabs */}
      <div className="flex gap-1 mb-4 flex-shrink-0">
        {CHAT_CHANNELS.map(c => (
          <button key={c.value} onClick={() => setChannel(c.value)}
            className={`px-4 py-2 text-xs tracking-wider rounded-sm border transition-all ${channel === c.value ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-[#120e08] border-amber-900/20 text-amber-800 hover:border-amber-800"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-[#120e08] border border-amber-900/20 rounded-sm overflow-y-auto p-4 space-y-3 min-h-0">
        {!messages?.length ? (
          <p className="text-amber-900 text-sm text-center py-8">Chưa có tin nhắn nào. Hãy là người đầu tiên lên tiếng!</p>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-900/20 border border-amber-900/30 flex items-center justify-center text-xs text-amber-700 flex-shrink-0">
                {m.senderName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-amber-400 text-xs font-medium">{m.senderName}</span>
                  <span className="text-amber-900 text-xs">[{m.senderRealm}]</span>
                  <span className="text-amber-900/40 text-xs ml-auto">{formatTime(m.createdAt)}</span>
                </div>
                <p className="text-amber-200 text-sm break-words">{m.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-3 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          maxLength={300}
          className="flex-1 bg-[#120e08] border border-amber-900/30 rounded-sm px-4 py-2.5 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-700 text-sm"
        />
        <button
          type="submit"
          disabled={send.isPending || !input.trim()}
          className="px-5 py-2.5 bg-amber-900/20 border border-amber-800/40 text-amber-600 hover:text-amber-400 text-sm rounded-sm transition-all disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
