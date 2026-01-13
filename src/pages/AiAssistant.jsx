import { useEffect, useMemo, useRef, useState } from "react";
import { aiApi } from "../api/ai.api";
import { useAuth } from "../auth/AuthContext";

const ROLE = { ADMIN: "ADMIN", TECHNICIAN: "TECHNICIAN" };

function normalizeRoles(user) {
  const raw = user?.roles ?? (user?.role ? [user.role] : []);
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((r) => String(r || "").trim())
    .filter(Boolean)
    .map((r) => r.replace(/^ROLE_/, "").toUpperCase());
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WELCOME_MESSAGE =
  "Hi! I’m your field-tech AI assistant. Describe the issue (ONT blinking, no signal, wrong port binding, WAN down) and I’ll suggest checks + next actions.";

export default function AiAssistant() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user), [user]);
  const isAllowed = roles.includes(ROLE.ADMIN) || roles.includes(ROLE.TECHNICIAN);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [messages, setMessages] = useState(() => [
    { role: "assistant", time: nowTime(), content: WELCOME_MESSAGE },
  ]);

  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async (overrideText) => {
    const text = String(overrideText ?? input ?? "").trim();
    if (!text || loading) return;

    setErr("");
    setLoading(true);

    setMessages((m) => [...m, { role: "user", time: nowTime(), content: text }]);
    setInput("");

    try {
      const reply = await aiApi.chat(text);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          time: nowTime(),
          content: reply || "I didn’t receive a response. Try again.",
        },
      ]);
    } catch (e) {
      console.error("AI chat error:", e);
      const status = e?.response?.status;
      const body = e?.response?.data;
      setErr(
        `AI request failed. HTTP ${status || "?"}: ${
          body?.message || body?.error || JSON.stringify(body || e.message)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    // Enter sends. Shift+Enter makes a newline (standard chat behavior)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setErr("");
    setLoading(false);
    setInput("");
    setMessages([{ role: "assistant", time: nowTime(), content: WELCOME_MESSAGE }]);
  };

  if (!isAllowed) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        You don’t have access to AI Assistant.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">AI Assistant</h2>
          <p className="mt-1 text-sm text-slate-400">
            Troubleshoot ONT + install issues with step-by-step checks. (Admin / Technician)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0b1220] px-3 py-2 text-xs text-slate-300">
          Logged in as{" "}
          <span className="font-semibold text-slate-100">{user?.username || "user"}</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-slate-200 font-semibold">AI chat enabled</span>
        </div>
      </div>

      {/* Main chat shell */}
      <div className="rounded-3xl border border-slate-800 bg-[#070b14] shadow-sm overflow-hidden">
        {/* Top status bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-[#0b1220] px-4 py-3">
          <div className="flex items-center gap-2">
            <AiDot live={loading} />
            <div className="text-sm font-semibold text-slate-100">Field Tech Assistant</div>
            <div className="text-xs text-slate-400">{loading ? "Thinking…" : "Online"}</div>
          </div>
        </div>

        {/* Messages (taller fixed chat window) */}
          <div className="h-[440px] overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, idx) => (
            <ChatRow key={idx} msg={m} username={user?.username} />
          ))}

          {loading && <TypingRow />}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {err && (
          <div className="border-t border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-slate-800 bg-[#0b1220] px-4 py-3">
          <div className="grid gap-2">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Describe the issue… e.g., ONT blinking red (X9100), Splitter A2 port 3"
                rows={2}
                className="w-full resize-none rounded-2xl border border-slate-700 bg-[#0a1020] px-4 py-3 pr-44 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={() => send()}
                  disabled={loading || !String(input).trim()}
                  className={[
                    "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                    loading || !String(input).trim()
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]",
                  ].join(" ")}
                >
                  Send
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={clearChat}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0a1020] px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/40 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  Clear chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-100">Quick Prompts</div>
          <div className="text-xs text-slate-400">One click → send</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <QuickPrompt
            text="ONT blinking red – model X9100, connected to Splitter A2 port 3. What to check?"
            onPick={(t) => send(t)}
            disabled={loading}
          />
          <QuickPrompt
            text="No internet after install. ONT is green but customer has no WAN. What to verify?"
            onPick={(t) => send(t)}
            disabled={loading}
          />
          <QuickPrompt
            text="Customer reports frequent drops. How do I isolate whether it's fiber, port, or ONT?"
            onPick={(t) => send(t)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function AiDot({ live }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span
        className={[
          "absolute inline-flex h-full w-full rounded-full opacity-60",
          live ? "animate-ping bg-blue-400" : "bg-emerald-400",
        ].join(" ")}
      />
      <span
        className={[
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          live ? "bg-blue-400" : "bg-emerald-400",
        ].join(" ")}
      />
    </span>
  );
}

function ChatRow({ msg, username }) {
  const isUser = msg.role === "user";
  const name = isUser ? (username || "You") : "AI";
  const initials = isUser ? "U" : "AI";

  return (
    <div className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Avatar initials={initials} kind="ai" />}

      <div className="max-w-[78%]">
        <div className={`mb-1 flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className="text-xs font-semibold text-slate-300">{name}</div>
          <div className="text-[11px] text-slate-500">{msg.time}</div>
        </div>

        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap break-words leading-relaxed shadow-sm",
            isUser
              ? "border-blue-700/40 bg-blue-950/30 text-blue-100"
              : "border-slate-700 bg-[#0a1020] text-slate-200",
          ].join(" ")}
        >
          {msg.content}
        </div>
      </div>

      {isUser && <Avatar initials={initials} kind="user" />}
    </div>
  );
}

function Avatar({ initials, kind }) {
  const cls =
    kind === "ai"
      ? "border-blue-700/40 bg-blue-950/40 text-blue-200"
      : "border-slate-700 bg-slate-900/40 text-slate-200";

  return (
    <div className={`h-9 w-9 shrink-0 rounded-full border ${cls} flex items-center justify-center text-xs font-extrabold`}>
      {initials}
    </div>
  );
}

function TypingRow() {
  return (
    <div className="flex items-end gap-3 justify-start">
      <Avatar initials="AI" kind="ai" />
      <div className="max-w-[78%]">
        <div className="mb-1 flex items-center gap-2">
          <div className="text-xs font-semibold text-slate-300">AI</div>
          <div className="text-[11px] text-slate-500">{nowTime()}</div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-[#0a1020] px-4 py-3">
          <div className="flex items-center gap-2">
            <Dot /> <Dot delay="200ms" /> <Dot delay="400ms" />
            <span className="ml-2 text-xs text-slate-400">Thinking…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

function QuickPrompt({ text, onPick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(text)}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        disabled
          ? "border-slate-800 bg-slate-900/30 text-slate-500 cursor-not-allowed"
          : "border-slate-700 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-900/60",
      ].join(" ")}
      title="Click to send"
    >
      {text}
    </button>
  );
}
