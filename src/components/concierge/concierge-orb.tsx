import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { progressQuest } from "@/lib/gamification";

const SEEDS: UIMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "👋 Hi! I'm your **Perkly Concierge**. Tell me what you want from this month and I'll build the perfect benefits bundle.\n\nTry: *\"I want to start the gym and a weekend trip — 20,000 ALL budget\"*",
      },
    ],
  } as UIMessage,
];

export function ConciergeOrb() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: user?.id ?? "anon",
    messages: SEEDS,
    transport: new DefaultChatTransport({ api: "/api/concierge" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value || isLoading) return;
    setInput("");
    if (user) progressQuest(user.id, "daily_concierge").catch(() => {});
    await sendMessage({ text: value });
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-110 sm:h-20 sm:w-20"
          aria-label="Open AI Concierge"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/60 to-primary-glow/40 blur-md" />
          <Sparkles className="relative h-7 w-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(640px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-primary-glow/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-sm font-bold">Perkly Concierge</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  AI · always on
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const mine = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {mine ? (
                      <p className="whitespace-pre-wrap">{text}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Concierge is thinking…
              </div>
            )}
            {error && (
              <p className="text-xs text-destructive">
                Something went wrong. Try again in a moment.
              </p>
            )}
          </div>

          <div className="border-t border-border bg-background/80 px-3 py-2">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything — budget, goals, vibes…"
                rows={1}
                className="min-h-[40px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
