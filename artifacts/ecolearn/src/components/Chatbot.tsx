import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Message = { role: "user" | "assistant"; content: string };

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const SUGGESTIONS = [
  "What is SDG 13 Climate Action?",
  "How can students help reduce plastic waste?",
  "What are the 17 SDGs?",
  "Explain SDG 4 Quality Education",
  "How are SDGs connected to each other?",
];

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "👋 Hi! I'm EcoBot, your SDG learning assistant. Ask me anything about the 17 Sustainable Development Goals, climate change, sustainability, or how you can make a difference! 🌍" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return null;

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Sorry, I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && !minimized && (
        <div className="w-80 sm:w-96 h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm">EcoBot 🌍</p>
                <p className="text-xs text-green-100">SDG Learning Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="w-7 h-7 text-white hover:bg-white/20" onClick={() => setMinimized(true)}>
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="w-7 h-7 text-white hover:bg-white/20" onClick={() => setOpen(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-green-700" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-green-700 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-700" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-white">
              <p className="text-xs text-gray-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTIONS.slice(0, 3).map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-1 hover:bg-green-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about SDGs..."
              className="text-sm rounded-full"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="rounded-full bg-green-700 hover:bg-green-600 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {open && minimized && (
        <div
          className="bg-green-700 text-white rounded-2xl px-4 py-2 cursor-pointer hover:bg-green-600 shadow-lg flex items-center gap-2 text-sm font-medium"
          onClick={() => setMinimized(false)}
        >
          <Bot className="w-4 h-4" />
          EcoBot
          {messages.length > 1 && (
            <span className="bg-white text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {messages.length - 1}
            </span>
          )}
        </div>
      )}

      <button
        onClick={() => { setOpen(o => !o); setMinimized(false); }}
        className="w-14 h-14 bg-gradient-to-br from-green-700 to-emerald-600 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all text-white"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
