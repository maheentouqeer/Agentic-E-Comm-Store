import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  MessageSquare,
  Mic,
  Send,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage, ChatTurn } from "@/types/agents";

const SUGGESTIONS = [
  "I need a laptop for video editing under $900",
  "Quote for 30 units of LT-002 shipped internationally",
  "Where's my order ORD-1002",
  "Is LT-003 in stock",
];

/** Minimal inline formatter for **bold** and line breaks. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, li) => (
        <span key={li} className="block">
          {line.split(/(\*\*[^*]+\*\*)/g).map((chunk, ci) =>
            chunk.startsWith("**") && chunk.endsWith("**") ? (
              <strong key={ci} className="font-semibold">
                {chunk.slice(2, -2)}
              </strong>
            ) : (
              <span key={ci}>{chunk}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

function ReasoningToggle({ turn }: { turn: ChatTurn }) {
  const [open, setOpen] = useState(false);
  const hasTrace = (turn.tools_used?.length ?? 0) > 0 || (turn.retrieved?.length ?? 0) > 0;
  if (!hasTrace) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        Show agent reasoning
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-md border border-border bg-secondary/60 p-3 text-xs">
          <div>
            <div className="eyebrow">Tools used</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {turn.tools_used?.length ? (
                turn.tools_used.map((t) => (
                  <span key={t} className="rounded bg-accent px-1.5 py-0.5 font-mono text-accent-foreground">
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">none</span>
              )}
            </div>
          </div>
          <div>
            <div className="eyebrow">Retrieved context</div>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {turn.retrieved?.length ? (
                turn.retrieved.map((r) => (
                  <li key={r} className="font-mono">
                    {r}
                  </li>
                ))
              ) : (
                <li>none</li>
              )}
            </ul>
          </div>
          {turn.tool_result && (
            <div>
              <div className="eyebrow">Tool result</div>
              <pre className="mt-1 overflow-x-auto rounded bg-ink p-2 font-mono text-[11px] text-ink-foreground">
                {JSON.stringify(turn.tool_result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turnsRef = useRef<ChatTurn[]>([]);
  const mutedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  turnsRef.current = turns;
  mutedRef.current = muted;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, thinking]);

  const speak = useCallback((text: string) => {
    if (mutedRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
    utterance.rate = 1.03;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      const history: ChatMessage[] = turnsRef.current.map(({ role, content }) => ({ role, content }));
      setTurns((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setThinking(true);
      try {
        const res = await sendChatMessage(trimmed, history);
        setTurns((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.response,
            tools_used: res.tools_used,
            retrieved: res.retrieved,
            tool_result: res.tool_result,
          },
        ]);
        speak(res.response);
      } catch {
        setTurns((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong reaching the assistant. Please try again in a moment.",
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [thinking, speak],
  );

  const toggleMic = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setVoiceError(null);
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) void send(transcript);
    };
    recognition.onerror = () => {
      setVoiceError("I couldn't hear that — check microphone permissions and try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, send]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        aria-label="Open AI Assistant"
        className="fixed bottom-5 right-5 z-50 h-14 gap-2 rounded-full px-5 shadow-lift"
      >
        <MessageSquare className="size-5" />
        <span className="hidden sm:inline">Ask AI</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-5">
            <div>
              <SheetTitle className="font-display">AI Assistant</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Products, stock, bulk quotes and order tracking
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={muted ? "Unmute spoken replies" : "Mute spoken replies"}
                onClick={() => {
                  setMuted((m) => !m);
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {turns.length === 0 && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about the catalog, your order or bulk pricing. Try one of these:
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, i) => (
              <div key={i} className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[88%]", turn.role === "user" && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      turn.role === "user"
                        ? "bg-ink text-left text-ink-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <RichText text={turn.content} />
                  </div>
                  {turn.role === "assistant" && <ReasoningToggle turn={turn} />}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            {voiceError && <p className="mb-2 text-xs text-destructive">{voiceError}</p>}
            {listening && <p className="mb-2 text-xs text-primary">Listening… speak now.</p>}
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask about a product, quote or order…"
                rows={1}
                className="max-h-32 min-h-11 resize-none"
              />
              <Button
                variant={listening ? "default" : "outline"}
                size="icon"
                className="size-11 shrink-0"
                aria-label="Speak your question"
                onClick={toggleMic}
              >
                <Mic className="size-4" />
              </Button>
              <Button
                size="icon"
                className="size-11 shrink-0"
                aria-label="Send message"
                disabled={thinking || !input.trim()}
                onClick={() => void send(input)}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
