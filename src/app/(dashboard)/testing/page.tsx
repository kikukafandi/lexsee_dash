"use client";

// Testing Suite page — a dedicated area for admin to test backend features.
// Tabs: Push Notifications, AI Features, API Tester, Plagiarism Checker.

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ThumbsUp, ThumbsDown, BookOpen, Smartphone, Bot, Zap, Search, Send, Plus, MessageSquare } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type { ChatResponse } from "@/types";

// ─── Tab type ──────────────────────────────────────────────────────────────

type Tab = "push" | "ai" | "api" | "plagiarism";

// ─── Push Notification Tester ──────────────────────────────────────────────

// ─── Push Notification Tester (Enhanced) ──────────────────────────────────

type NotifHistoryEntry = {
  id: number;
  at: string;
  title: string;
  target: string;
  status: "success" | "error" | "pending";
  message: string;
};

function PushNotifTester() {
  const [title, setTitle] = useState("Test Notifikasi");
  const [body, setBody] = useState("Ini adalah notifikasi test dari Admin Console.");
  const [fcmToken, setFcmToken] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<NotifHistoryEntry[]>([]);

  useEffect(() => {
    apiFetch<{ users: Array<{ id: string; name: string; email: string }> }>("/api/admin/users")
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, []);

  const effectiveTarget = fcmToken.trim()
    ? `FCM: ${fcmToken.trim().slice(0, 20)}...`
    : selectedUserId
    ? `User: ${users.find((u) => u.id === selectedUserId)?.email ?? selectedUserId}`
    : "Broadcast (semua pengguna)";

  const payload = {
    title,
    body,
    ...(fcmToken.trim() ? { fcmToken: fcmToken.trim() } : {}),
    ...(selectedUserId && !fcmToken.trim() ? { userId: selectedUserId } : {}),
  };

  async function send() {
    setSending(true);
    const entryBase = {
      id: Date.now(),
      at: new Date().toLocaleTimeString("id-ID"),
      title,
      target: effectiveTarget,
    };
    try {
      await apiFetch("/api/notifications/test", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setHistory((prev) => [{ ...entryBase, status: "success", message: "Terkirim." }, ...prev.slice(0, 9)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal";
      const isNotImplemented = msg.includes("404") || msg.includes("Cannot POST") || msg.includes("Not Found");
      setHistory((prev) => [
        {
          ...entryBase,
          status: isNotImplemented ? "pending" : "error",
          message: isNotImplemented
            ? "Endpoint belum tersedia (modul FCM belum diimplementasi)"
            : msg,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-lg bg-success/10 border border-success/25 text-text-med text-sm">
        <Smartphone size={14} className="inline mr-1.5 shrink-0" />
        FCM aktif. Pilih user untuk kirim personal, atau biarkan kosong untuk <strong className="text-text-high">broadcast ke semua pengguna</strong> (topic: all_users).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Judul Notifikasi</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
            />
          </div>
          <div>
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Isi Pesan</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
            />
          </div>
          <div>
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Target Pengguna</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={usersLoading || !!fcmToken.trim()}
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon disabled:opacity-50"
            >
              <option value="">Broadcast (semua pengguna)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} — {u.email}
                </option>
              ))}
            </select>
            {usersLoading && <p className="text-text-low text-xs mt-1">Memuat daftar pengguna...</p>}
          </div>
          <div>
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">
              FCM Token Manual (override dropdown)
            </label>
            <input
              value={fcmToken}
              onChange={(e) => setFcmToken(e.target.value)}
              placeholder="AAAAxxxxx... (FCM device token)"
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon font-mono"
            />
            <p className="text-text-low text-xs mt-1">Jika diisi, akan override pilihan pengguna di atas.</p>
          </div>
          <button
            onClick={send}
            disabled={sending}
            className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <><LoadingSpinner size="sm" /> Mengirim...</> : "Kirim Notifikasi Test"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-text-low text-xs uppercase tracking-wider mb-2">Preview Payload (JSON)</p>
            <pre className="bg-surface-2 border border-neutral-200 rounded-lg p-3 text-xs text-gold font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-text-low text-xs uppercase tracking-wider mb-1">Target Saat Ini</p>
            <p className="text-text-high text-sm bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2">
              {effectiveTarget}
            </p>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-text-low text-xs uppercase tracking-wider mb-2">Riwayat Pengiriman (sesi ini)</p>
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                  entry.status === "success"
                    ? "bg-success/10 border-success/25"
                    : entry.status === "pending"
                    ? "bg-warning/10 border-warning/25"
                    : "bg-danger/10 border-danger/25"
                }`}
              >
                <span className={entry.status === "success" ? "text-success" : entry.status === "pending" ? "text-warning" : "text-danger"}>
                  {entry.status === "success" ? "✓" : entry.status === "pending" ? "⏳" : "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-high font-medium truncate">{entry.title}</p>
                  <p className="text-text-low text-xs">{entry.at} · {entry.target}</p>
                  <p className="text-text-med text-xs mt-0.5">{entry.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Feature Tester ─────────────────────────────────────────────────────

type AiSubTab = "quick" | "conversation" | "generate" | "opinion" | "summarize" | "compare" | "verdict" | "contract" | "expert" | "compliance" | "audit" | "citation";

// ── Quick Chat (stateless) ────────────────────────────────────────────────

function QuickChat() {
  const [msg, setMsg] = useState("");
  const [res, setRes] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!msg.trim()) return;
    setLoading(true);
    setRes(null);
    setError("");
    try {
      const data = await apiFetch<ChatResponse>("/api/legal/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
        timeoutMs: 90_000,
      });
      setRes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(messageId: string, helpful: boolean) {
    await apiFetch("/api/legal/feedback", {
      method: "POST",
      body: JSON.stringify({ messageId, helpful }),
    }).catch(() => {});
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Pertanyaan tunggal tanpa memori konteks. Cocok untuk test endpoint secara cepat.</p>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) send(); }}
        rows={3}
        placeholder="Tanyakan masalah hukum... (Ctrl+Enter untuk kirim)"
        className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
      />
      <button
        onClick={send}
        disabled={loading || !msg.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> AI memproses...</> : <><Send size={14} /> Tanya AI Lexsy</>}
      </button>

      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}

      {res && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
            <p className="text-text-low text-xs uppercase tracking-wider mb-2">Jawaban AI</p>
            <MarkdownRenderer content={res.answer} />
          </div>

          {res.messageId && (
            <div className="flex gap-2">
              <button
                onClick={() => sendFeedback(res.messageId!, true)}
                className="px-3 py-1.5 rounded-lg text-xs bg-success/10 text-success border border-success/25 hover:bg-success/20 transition-colors flex items-center gap-1"
              >
                <ThumbsUp size={12} /> Membantu
              </button>
              <button
                onClick={() => sendFeedback(res.messageId!, false)}
                className="px-3 py-1.5 rounded-lg text-xs bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20 transition-colors flex items-center gap-1"
              >
                <ThumbsDown size={12} /> Kurang tepat
              </button>
            </div>
          )}

          {res.sources?.length > 0 && (
            <div className="p-3 rounded-xl bg-surface-2 border border-neutral-100">
              <p className="text-text-low text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                <BookOpen size={12} /> Referensi ({res.sources.length})
              </p>
              {res.sources.map((s, i) => (
                <div key={i} className="py-2 border-b border-neutral-100 last:border-0">
                  <p className="text-text-high text-xs font-medium">{i + 1}. {s.title}</p>
                  <p className="text-text-low text-xs mt-0.5">{s.excerpt?.slice(0, 120)}...</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-text-low text-xs">{res.retrievedDocs} dokumen dianalisa</p>
        </div>
      )}
    </div>
  );
}

// ── Conversation Chat (session-based) ─────────────────────────────────────

type BubbleRole = "user" | "assistant";
type Bubble = {
  id: string;
  role: BubbleRole;
  content: string;
  messageId?: string;
  sources?: ChatResponse["sources"];
  retrievedDocs?: number;
};

function ConversationChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, loading]);

  async function startSession() {
    setStarting(true);
    setError("");
    try {
      const data = await apiFetch<{ sessionId: string }>("/api/legal/sessions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSessionId(data.sessionId);
      setBubbles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat sesi");
    } finally {
      setStarting(false);
    }
  }

  function resetSession() {
    setSessionId(null);
    setBubbles([]);
    setInput("");
    setError("");
  }

  async function send() {
    if (!input.trim() || !sessionId) return;
    const userText = input.trim();
    setInput("");
    setBubbles((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userText }]);
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<ChatResponse>(
        `/api/legal/sessions/${sessionId}/messages`,
        { method: "POST", body: JSON.stringify({ message: userText }), timeoutMs: 90_000 }
      );
      setBubbles((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          messageId: data.messageId,
          sources: data.sources,
          retrievedDocs: data.retrievedDocs,
        },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(messageId: string, helpful: boolean) {
    await apiFetch("/api/legal/feedback", {
      method: "POST",
      body: JSON.stringify({ messageId, helpful }),
    }).catch(() => {});
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <MessageSquare size={40} className="text-gold/40" />
        <p className="text-text-med text-sm text-center max-w-xs">
          Mode percakapan menyimpan konteks antar pesan sehingga AI dapat menjawab pertanyaan lanjutan.
        </p>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          onClick={startSession}
          disabled={starting}
          className="px-6 py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {starting ? <><LoadingSpinner size="sm" /> Membuat sesi...</> : <><Plus size={14} /> Mulai Percakapan Baru</>}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Session header */}
      <div className="flex items-center justify-between text-xs text-text-low">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          Sesi aktif · <span className="font-mono text-text-med">{sessionId.slice(0, 16)}…</span>
        </span>
        <button onClick={resetSession} className="text-danger/70 hover:text-danger transition-colors">
          Akhiri Sesi
        </button>
      </div>

      {/* Bubble list */}
      <div className="flex flex-col gap-3 min-h-48 max-h-120 overflow-y-auto pr-1">
        {bubbles.length === 0 && (
          <p className="text-text-low text-sm text-center py-8">Mulai percakapan dengan mengirim pesan di bawah.</p>
        )}

        {bubbles.map((b) => (
          <div key={b.id} className={`flex flex-col gap-1 ${b.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                b.role === "user"
                  ? "bg-gold text-white rounded-br-sm"
                  : "bg-surface-2 border border-neutral-200 text-text-high rounded-bl-sm"
              }`}
            >
              {b.role === "user" ? (
                <p className="leading-relaxed">{b.content}</p>
              ) : (
                <MarkdownRenderer content={b.content} />
              )}
            </div>

            {/* Sources & feedback for assistant bubbles */}
            {b.role === "assistant" && (
              <div className="flex flex-col gap-1.5 w-full max-w-[85%]">
                {b.sources && b.sources.length > 0 && (
                  <details className="text-xs">
                    <summary className="text-text-low cursor-pointer hover:text-text-med flex items-center gap-1 list-none select-none">
                      <BookOpen size={11} /> {b.sources.length} referensi · {b.retrievedDocs} dokumen dianalisa
                    </summary>
                    <div className="mt-1.5 bg-surface-2 border border-neutral-100 rounded-lg p-2 space-y-1.5">
                      {b.sources.map((s, i) => (
                        <div key={i} className="py-1 border-b border-neutral-100 last:border-0">
                          <p className="text-text-high font-medium">{i + 1}. {s.title}</p>
                          <p className="text-text-low mt-0.5">{s.excerpt?.slice(0, 120)}...</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {b.messageId && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => sendFeedback(b.messageId!, true)}
                      className="px-2 py-1 rounded text-xs bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors flex items-center gap-1"
                    >
                      <ThumbsUp size={10} /> Membantu
                    </button>
                    <button
                      onClick={() => sendFeedback(b.messageId!, false)}
                      className="px-2 py-1 rounded text-xs bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors flex items-center gap-1"
                    >
                      <ThumbsDown size={10} /> Kurang tepat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="bg-surface-2 border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-text-low text-sm">
              <LoadingSpinner size="sm" /> AI sedang berpikir...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}

      {/* Input area */}
      <div className="flex gap-2 pt-1 border-t border-neutral-100">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={2}
          disabled={loading}
          placeholder="Tulis pesan... (Enter kirim, Shift+Enter baris baru)"
          className="flex-1 bg-surface-2 border border-neutral-200 rounded-xl px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-none disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 rounded-xl bg-gold text-white hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Generate Document ─────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: "MOU", label: "MOU (Memorandum of Understanding)" },
  { value: "SURAT_KUASA", label: "Surat Kuasa" },
  { value: "PERJANJIAN_KERJA", label: "Perjanjian Kerja" },
  { value: "PERJANJIAN_SEWA", label: "Perjanjian Sewa" },
  { value: "SURAT_SOMASI", label: "Surat Somasi" },
];

function GenerateDoc() {
  const [docType, setDocType] = useState("MOU");
  const [docVars, setDocVars] = useState<Record<string, string>>({
    pihak1: "", pihak2: "", perihal: "", durasi: "1 tahun", lokasi: "Jakarta", tanggal: "",
  });
  const [docResult, setDocResult] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  async function generateDoc() {
    setDocLoading(true);
    setDocResult("");
    setDocError("");
    try {
      const res = await apiFetch<{ content: string }>("/api/legal/generate-document", {
        method: "POST",
        body: JSON.stringify({ docType, variables: docVars }),
        timeoutMs: 90_000,
      });
      setDocResult(res.content ?? JSON.stringify(res, null, 2));
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setDocLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Generate dokumen hukum berdasarkan template. AI mengisi template tanpa mengubah struktur atau menginvent klausul baru.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Tipe Dokumen</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
        >
          {DOC_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>{dt.label}</option>
          ))}
        </select>
      </div>

      {["pihak1", "pihak2", "perihal", "durasi", "lokasi", "tanggal"].map((key) => (
        <div key={key}>
          <label className="block text-text-low text-xs uppercase tracking-wider mb-1">{key}</label>
          <input
            value={docVars[key] ?? ""}
            onChange={(e) => setDocVars((prev) => ({ ...prev, [key]: e.target.value }))}
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
          />
        </div>
      ))}

      <button
        onClick={generateDoc}
        disabled={docLoading}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {docLoading ? <><LoadingSpinner size="sm" /> Membuat dokumen...</> : "Generate Dokumen"}
      </button>

      {docError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{docError}</div>
      )}

      {docResult && (
        <div className="bg-surface-2 border border-neutral-200 rounded-lg px-4 py-3">
          <MarkdownRenderer content={docResult} />
        </div>
      )}
    </div>
  );
}

// ── Legal Opinion ─────────────────────────────────────────────────────────

function LegalOpinionTester() {
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<{ opinion: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<{ opinion: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number }>("/api/legal/opinion", {
        method: "POST",
        body: JSON.stringify({ question: question.trim(), ...(domain.trim() ? { domain: domain.trim() } : {}) }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Menghasilkan legal opinion baku: Kasus Posisi → Isu Hukum → Dasar Hukum → Analisis → Kesimpulan &amp; Rekomendasi.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Pertanyaan / Kasus Hukum</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="Contoh: PT A tidak membayar gaji karyawan selama 3 bulan. Apa dasar hukum dan sanksinya?"
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Domain Hukum (opsional)</label>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="ketenagakerjaan / perdata / pidana / bisnis"
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !question.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Membuat Legal Opinion...</> : "Generate Legal Opinion"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
            <p className="text-text-low text-xs uppercase tracking-wider mb-2">Legal Opinion</p>
            <MarkdownRenderer content={result.opinion} />
          </div>
          {result.sources?.length > 0 && (
            <details className="text-xs">
              <summary className="text-text-low cursor-pointer hover:text-text-med flex items-center gap-1 list-none">
                <BookOpen size={12} /> {result.sources.length} referensi · {result.retrievedDocs} dokumen dianalisa
              </summary>
              <div className="mt-2 bg-surface-2 border border-neutral-100 rounded-lg p-2 space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="py-1 border-b border-neutral-100 last:border-0">
                    <p className="text-text-high font-medium">{i + 1}. {s.title}</p>
                    <p className="text-text-low mt-0.5">{s.excerpt?.slice(0, 120)}...</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rangkum Regulasi (Executive Summary) ──────────────────────────────────

function SummarizeTester() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<{ summary: string; title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<{ summary: string; title: string }>("/api/legal/summarize", {
        method: "POST",
        body: JSON.stringify({ text: text.trim(), ...(title.trim() ? { title: title.trim() } : {}) }),
        timeoutMs: 90_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Rangkum peraturan menjadi Executive Summary: Identitas, Kewajiban, Batas Waktu Kepatuhan, Sanksi, dan Dampak Praktis.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Judul Peraturan (opsional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: UU No. 13 Tahun 2003 tentang Ketenagakerjaan"
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
        />
      </div>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Peraturan</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste teks peraturan / undang-undang di sini..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !text.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Merangkum...</> : "Buat Executive Summary"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
          <p className="text-text-low text-xs uppercase tracking-wider mb-2">Executive Summary · {result.title}</p>
          <MarkdownRenderer content={result.summary} />
        </div>
      )}
    </div>
  );
}

// ── Perbandingan Dokumen ───────────────────────────────────────────────────

function CompareTester() {
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [result, setResult] = useState<{ analysis: string; retrievedDocs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!docA.trim() || !docB.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<{ analysis: string; retrievedDocs: number }>("/api/legal/compare", {
        method: "POST",
        body: JSON.stringify({ docA: docA.trim(), docB: docB.trim() }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Bandingkan dua putusan/dokumen: matriks (Pokok Sengketa, Ratio Decidendi, Regulasi, Amar, Yurisprudensi) + analisis naratif persamaan &amp; perbedaan.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Dokumen A</label>
          <textarea
            value={docA}
            onChange={(e) => setDocA(e.target.value)}
            rows={6}
            placeholder="Paste teks putusan / dokumen pertama..."
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
          />
        </div>
        <div>
          <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Dokumen B</label>
          <textarea
            value={docB}
            onChange={(e) => setDocB(e.target.value)}
            rows={6}
            placeholder="Paste teks putusan / dokumen kedua..."
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
          />
        </div>
      </div>
      <button
        onClick={run}
        disabled={loading || !docA.trim() || !docB.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Membandingkan...</> : "Bandingkan Dokumen"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
          <p className="text-text-low text-xs uppercase tracking-wider mb-2">Hasil Perbandingan · {result.retrievedDocs} dok. dianalisa</p>
          <MarkdownRenderer content={result.analysis} />
        </div>
      )}
    </div>
  );
}

// ── Analisis Kontrak ──────────────────────────────────────────────────────

function ContractTester() {
  const [contractText, setContractText] = useState("");
  const [perspective, setPerspective] = useState("");
  const [result, setResult] = useState<{ analysis: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!contractText.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<{ analysis: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number }>("/api/legal/analyze-contract", {
        method: "POST",
        body: JSON.stringify({ contractText: contractText.trim(), ...(perspective.trim() && { perspective: perspective.trim() }) }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Syarat sah (Pasal 1320 KUH Perdata) → Hak &amp; Kewajiban → Risiko per Klausul (🔴/🟡/🟢) → Klausul yang Hilang → Rekomendasi.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Kontrak</label>
        <textarea
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          rows={8}
          placeholder="Paste isi kontrak/perjanjian..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Sudut Pandang Pihak (opsional)</label>
        <input
          value={perspective}
          onChange={(e) => setPerspective(e.target.value)}
          placeholder="Mis. Penyewa, Pihak Kedua"
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !contractText.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Menganalisis kontrak...</> : "Analisis Kontrak"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
            <p className="text-text-low text-xs uppercase tracking-wider mb-2">Hasil Analisis Kontrak</p>
            <MarkdownRenderer content={result.analysis} />
          </div>
          {result.sources?.length > 0 && (
            <details className="text-xs">
              <summary className="text-text-low cursor-pointer hover:text-text-med flex items-center gap-1 list-none">
                <BookOpen size={12} /> {result.sources.length} referensi · {result.retrievedDocs} dokumen dianalisa
              </summary>
              <div className="mt-2 bg-surface-2 border border-neutral-100 rounded-lg p-2 space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="py-1 border-b border-neutral-100 last:border-0">
                    <p className="text-text-high font-medium">{i + 1}. {s.title}</p>
                    <p className="text-text-low mt-0.5">{s.excerpt?.slice(0, 120)}...</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ── Analisis Putusan ──────────────────────────────────────────────────────

function VerdictTester() {
  const [verdictText, setVerdictText] = useState("");
  const [result, setResult] = useState<{ analysis: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!verdictText.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<{ analysis: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number }>("/api/legal/analyze-verdict", {
        method: "POST",
        body: JSON.stringify({ verdictText: verdictText.trim() }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Analisis 2-tahap: Tahap 1 (Anatomi Objektif: Identitas, Amar, Dasar Hukum) → Tahap 2 (Analisis Kritis: Ratio Decidendi, Verifikasi Norma, Catatan Akademisi).</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Putusan Hakim</label>
        <textarea
          value={verdictText}
          onChange={(e) => setVerdictText(e.target.value)}
          rows={7}
          placeholder="Paste teks lengkap putusan hakim..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !verdictText.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Menganalisis putusan...</> : "Analisis Putusan"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
            <p className="text-text-low text-xs uppercase tracking-wider mb-2">Hasil Analisis Putusan</p>
            <MarkdownRenderer content={result.analysis} />
          </div>
          {result.sources?.length > 0 && (
            <details className="text-xs">
              <summary className="text-text-low cursor-pointer hover:text-text-med flex items-center gap-1 list-none">
                <BookOpen size={12} /> {result.sources.length} referensi · {result.retrievedDocs} dokumen dianalisa
              </summary>
              <div className="mt-2 bg-surface-2 border border-neutral-100 rounded-lg p-2 space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="py-1 border-b border-neutral-100 last:border-0">
                    <p className="text-text-high font-medium">{i + 1}. {s.title}</p>
                    <p className="text-text-low mt-0.5">{s.excerpt?.slice(0, 120)}...</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pendapat Ahli ─────────────────────────────────────────────────────────

function ExpertTester() {
  const [expertText, setExpertText] = useState("");
  const [result, setResult] = useState<{ analysis: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!expertText.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<{ analysis: string; sources: Array<{ title: string; excerpt: string }>; retrievedDocs: number }>("/api/legal/analyze-expert", {
        method: "POST",
        body: JSON.stringify({ expertText: expertText.trim() }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Peta argumen ahli dalam tabel 4-kolom (Ahli, Posisi, Dasar Hukum, Kelemahan Potensial) + sintesis posisi hukum yang defensible.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Jurnal / Pendapat Ahli Hukum</label>
        <textarea
          value={expertText}
          onChange={(e) => setExpertText(e.target.value)}
          rows={7}
          placeholder="Paste teks jurnal atau pendapat ahli hukum..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !expertText.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Menganalisis...</> : "Analisis Pendapat Ahli"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200">
            <p className="text-text-low text-xs uppercase tracking-wider mb-2">Hasil Analisis Pendapat Ahli</p>
            <MarkdownRenderer content={result.analysis} />
          </div>
          {result.sources?.length > 0 && (
            <details className="text-xs">
              <summary className="text-text-low cursor-pointer hover:text-text-med flex items-center gap-1 list-none">
                <BookOpen size={12} /> {result.sources.length} referensi · {result.retrievedDocs} dokumen dianalisa
              </summary>
              <div className="mt-2 bg-surface-2 border border-neutral-100 rounded-lg p-2 space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="py-1 border-b border-neutral-100 last:border-0">
                    <p className="text-text-high font-medium">{i + 1}. {s.title}</p>
                    <p className="text-text-low mt-0.5">{s.excerpt?.slice(0, 120)}...</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compliance Analysis ───────────────────────────────────────────────────

type ComplianceObligation = {
  id: string;
  kewajiban: string;
  pasal: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "RISK";
  alasan: string;
  rekomendasi: string;
};
type ComplianceResult = {
  obligations?: ComplianceObligation[];
  summary?: { total: number; compliant: number; nonCompliant: number; risk: number; kesimpulan: string };
  raw?: string;
  error?: string;
};

function ComplianceTester() {
  const [regulationText, setRegulationText] = useState("");
  const [companyData, setCompanyData] = useState("");
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!regulationText.trim() || !companyData.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<ComplianceResult>("/api/legal/compliance/analyze", {
        method: "POST",
        body: JSON.stringify({ regulationText: regulationText.trim(), companyData: companyData.trim() }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  const statusCls = (s: string) =>
    s === "COMPLIANT"
      ? "text-success bg-success/10 border-success/25"
      : s === "NON_COMPLIANT"
      ? "text-danger bg-danger/10 border-danger/25"
      : "text-warning bg-warning/10 border-warning/25";

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Analisis kepatuhan perusahaan terhadap regulasi. Menghasilkan daftar kewajiban dengan status COMPLIANT / NON_COMPLIANT / RISK per pasal.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Regulasi</label>
        <textarea
          value={regulationText}
          onChange={(e) => setRegulationText(e.target.value)}
          rows={5}
          placeholder="Paste teks peraturan yang relevan (UU, PP, Permen, dll.)..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Data Operasional Perusahaan</label>
        <textarea
          value={companyData}
          onChange={(e) => setCompanyData(e.target.value)}
          rows={4}
          placeholder="Deskripsikan kondisi, SOP, dan kebijakan perusahaan saat ini..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !regulationText.trim() || !companyData.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Menganalisis kepatuhan...</> : "Analisis Kepatuhan"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result?.error && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/25 text-warning text-sm">
          Format AI tidak valid.
          <pre className="mt-1 text-xs font-mono text-text-low whitespace-pre-wrap">{result.raw}</pre>
        </div>
      )}
      {result?.summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Total", val: result.summary.total, cls: "text-text-high" },
              { label: "Patuh", val: result.summary.compliant, cls: "text-success" },
              { label: "Risiko", val: result.summary.risk, cls: "text-warning" },
              { label: "Tidak Patuh", val: result.summary.nonCompliant, cls: "text-danger" },
            ].map((item) => (
              <div key={item.label} className="bg-surface-2 border border-neutral-200 rounded-lg py-2">
                <p className={`text-xl font-bold ${item.cls}`}>{item.val}</p>
                <p className="text-text-low text-xs">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-surface-2 border border-neutral-200 rounded-lg text-sm text-text-med">
            {result.summary.kesimpulan}
          </div>
          {result.obligations && result.obligations.length > 0 && (
            <div className="space-y-2">
              <p className="text-text-low text-xs uppercase tracking-wider">Detail Kewajiban</p>
              {result.obligations.map((ob) => (
                <div key={ob.id} className="p-3 bg-surface-2 border border-neutral-100 rounded-lg space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-text-high text-sm font-medium flex-1">{ob.kewajiban}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold ${statusCls(ob.status)}`}>{ob.status}</span>
                  </div>
                  <p className="text-text-low text-xs">Pasal: {ob.pasal}</p>
                  <p className="text-text-med text-xs">{ob.alasan}</p>
                  {ob.rekomendasi && <p className="text-gold/80 text-xs">↗ {ob.rekomendasi}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Document Audit ────────────────────────────────────────────────────────

type RedFlag = {
  id: string;
  klausulOrData: string;
  potensiPelanggaran: string;
  pasalYangDilanggar: string;
  tingkatRisiko: "MERAH" | "KUNING";
  rekomendasi: string;
};
type AuditResult = {
  redFlags?: RedFlag[];
  aspekPatuh?: string[];
  summary?: { totalRedFlags: number; merah: number; kuning: number; kesimpulan: string };
  raw?: string;
  error?: string;
};

function AuditTester() {
  const [documentText, setDocumentText] = useState("");
  const [regulationCategory, setRegulationCategory] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!documentText.trim() || !regulationCategory.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<AuditResult>("/api/legal/audit/document", {
        method: "POST",
        body: JSON.stringify({ documentText: documentText.trim(), regulationCategory: regulationCategory.trim() }),
        timeoutMs: 120_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Audit dokumen internal terhadap kategori regulasi. Mengidentifikasi red flag MERAH/KUNING dan aspek yang sudah patuh.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Kategori Regulasi</label>
        <input
          value={regulationCategory}
          onChange={(e) => setRegulationCategory(e.target.value)}
          placeholder="Contoh: UU Ketenagakerjaan No. 13 Tahun 2003"
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
        />
      </div>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Dokumen Internal</label>
        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          rows={7}
          placeholder="Paste teks SOP, perjanjian kerja, laporan, atau kebijakan perusahaan..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !documentText.trim() || !regulationCategory.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Mengaudit dokumen...</> : "Audit Dokumen"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result?.error && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/25 text-warning text-sm">
          Format AI tidak valid.
          <pre className="mt-1 text-xs font-mono text-text-low whitespace-pre-wrap">{result.raw}</pre>
        </div>
      )}
      {result?.summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-surface-2 border border-neutral-200 rounded-lg py-2">
              <p className="text-xl font-bold text-text-high">{result.summary.totalRedFlags}</p>
              <p className="text-text-low text-xs">Total Red Flags</p>
            </div>
            <div className="bg-surface-2 border border-danger/25 rounded-lg py-2">
              <p className="text-xl font-bold text-danger">{result.summary.merah}</p>
              <p className="text-text-low text-xs">MERAH</p>
            </div>
            <div className="bg-surface-2 border border-warning/25 rounded-lg py-2">
              <p className="text-xl font-bold text-warning">{result.summary.kuning}</p>
              <p className="text-text-low text-xs">KUNING</p>
            </div>
          </div>
          <div className="p-3 bg-surface-2 border border-neutral-200 rounded-lg text-sm text-text-med">{result.summary.kesimpulan}</div>
          {result.redFlags && result.redFlags.length > 0 && (
            <div className="space-y-2">
              <p className="text-text-low text-xs uppercase tracking-wider">Red Flags</p>
              {result.redFlags.map((rf) => (
                <div key={rf.id} className={`p-3 rounded-lg border space-y-1 ${rf.tingkatRisiko === "MERAH" ? "bg-danger/5 border-danger/25" : "bg-warning/5 border-warning/25"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-text-high text-sm font-medium flex-1">{rf.klausulOrData}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-bold ${rf.tingkatRisiko === "MERAH" ? "text-danger border-danger/50" : "text-warning border-warning/50"}`}>{rf.tingkatRisiko}</span>
                  </div>
                  <p className="text-text-med text-xs">{rf.potensiPelanggaran}</p>
                  <p className="text-text-low text-xs">Pasal: {rf.pasalYangDilanggar}</p>
                  {rf.rekomendasi && <p className="text-gold/80 text-xs">↗ {rf.rekomendasi}</p>}
                </div>
              ))}
            </div>
          )}
          {result.aspekPatuh && result.aspekPatuh.length > 0 && (
            <div className="space-y-1">
              <p className="text-text-low text-xs uppercase tracking-wider">Aspek yang Sudah Patuh</p>
              {result.aspekPatuh.map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                  <p className="text-text-med text-sm">{a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Citation Tracker ──────────────────────────────────────────────────────

type CitationItem = {
  teksAsli: string;
  nomor?: string;
  regulasi?: string;
  tahun?: string;
  jenisRegulasi?: string;
  status: "BERLAKU" | "TIDAK_DITEMUKAN";
  matchedDoc?: { title: string; sourceUrl?: string; publishedAt?: string; relevanceScore: number } | null;
  note?: string | null;
};
type CitationResult = {
  totalSitasiDitemukan: number;
  sitasiDiproses: number;
  results: CitationItem[];
};

function CitationTester() {
  const [documentText, setDocumentText] = useState("");
  const [result, setResult] = useState<CitationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!documentText.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = await apiFetch<CitationResult>("/api/legal/cite-check", {
        method: "POST",
        body: JSON.stringify({ documentText: documentText.trim() }),
        timeoutMs: 180_000,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  const berlakuCount = result?.results.filter((r) => r.status === "BERLAKU").length ?? 0;

  return (
    <div className="space-y-3">
      <p className="text-text-low text-xs">Ekstrak semua sitasi hukum dari dokumen, lalu cross-reference ke knowledge base untuk verifikasi status BERLAKU / TIDAK DITEMUKAN.</p>
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks Dokumen Hukum</label>
        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          rows={7}
          placeholder="Paste putusan, kontrak, atau peraturan yang mengandung sitasi hukum..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !documentText.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Mengekstrak &amp; memverifikasi sitasi...</> : "Cek Sitasi Hukum"}
      </button>
      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>}
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-surface-2 border border-neutral-200 rounded-lg py-2">
              <p className="text-xl font-bold text-text-high">{result.totalSitasiDitemukan}</p>
              <p className="text-text-low text-xs">Diekstrak</p>
            </div>
            <div className="bg-surface-2 border border-success/25 rounded-lg py-2">
              <p className="text-xl font-bold text-success">{berlakuCount}</p>
              <p className="text-text-low text-xs">Berlaku</p>
            </div>
            <div className="bg-surface-2 border border-neutral-200 rounded-lg py-2">
              <p className="text-xl font-bold text-text-med">{result.sitasiDiproses - berlakuCount}</p>
              <p className="text-text-low text-xs">Tidak Ditemukan</p>
            </div>
          </div>
          {result.results.length > 0 && (
            <div className="space-y-2">
              {result.results.map((r, i) => (
                <div key={i} className={`p-3 rounded-lg border space-y-1 ${r.status === "BERLAKU" ? "bg-success/5 border-success/25" : "bg-surface-2 border-neutral-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-text-high text-sm font-medium flex-1">{r.teksAsli}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold ${r.status === "BERLAKU" ? "text-success border-success/50 bg-success/10" : "text-text-low border-neutral-200"}`}>
                      {r.status === "BERLAKU" ? "✓ BERLAKU" : "— TIDAK DITEMUKAN"}
                    </span>
                  </div>
                  {r.regulasi && (
                    <p className="text-text-low text-xs">{r.jenisRegulasi ?? "Regulasi"}: {r.regulasi}{r.tahun ? ` (${r.tahun})` : ""}</p>
                  )}
                  {r.matchedDoc && (
                    <p className="text-text-med text-xs">Match: {r.matchedDoc.title} · skor {r.matchedDoc.relevanceScore}</p>
                  )}
                  {r.note && <p className="text-text-low text-xs italic">{r.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main AiFeatureTester ──────────────────────────────────────────────────

function AiFeatureTester() {
  const [subTab, setSubTab] = useState<AiSubTab>("quick");

  const tabs: { id: AiSubTab; label: string }[] = [
    { id: "quick", label: "Chat Singkat" },
    { id: "conversation", label: "Percakapan" },
    { id: "opinion", label: "Legal Opinion" },
    { id: "summarize", label: "Rangkum Regulasi" },
    { id: "compare", label: "Perbandingan" },
    { id: "verdict", label: "Analisis Putusan" },
    { id: "contract", label: "Analisis Kontrak" },
    { id: "expert", label: "Pendapat Ahli" },
    { id: "generate", label: "Buat Perjanjian" },
    { id: "compliance", label: "Compliance" },
    { id: "audit", label: "Audit Dokumen" },
    { id: "citation", label: "Cek Sitasi" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === t.id
                ? "bg-gold text-white"
                : "bg-surface-2 text-text-med hover:text-text-high border border-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "quick" && <QuickChat />}
      {subTab === "conversation" && <ConversationChat />}
      {subTab === "opinion" && <LegalOpinionTester />}
      {subTab === "summarize" && <SummarizeTester />}
      {subTab === "compare" && <CompareTester />}
      {subTab === "verdict" && <VerdictTester />}
      {subTab === "contract" && <ContractTester />}
      {subTab === "expert" && <ExpertTester />}
      {subTab === "generate" && <GenerateDoc />}
      {subTab === "compliance" && <ComplianceTester />}
      {subTab === "audit" && <AuditTester />}
      {subTab === "citation" && <CitationTester />}
    </div>
  );
}

// ─── API Tester ────────────────────────────────────────────────────────────

// Pre-defined endpoints for the datalist autocomplete
const KNOWN_ENDPOINTS = [
  { value: "/api/auth/login", label: "Login" },
  { value: "/api/profile", label: "Get Profile" },
  { value: "/api/legal/admin/stats", label: "KB Stats" },
  { value: "/api/legal/admin/documents", label: "KB Documents" },
  { value: "/api/legal/peraturan", label: "Peraturan List" },
  { value: "/api/legal/chat", label: "AI Chat (POST)" },
  { value: "/api/legal/generate-document", label: "Generate Doc (POST)" },
  { value: "/api/legal/admin/sync-setneg", label: "Sync Setneg (POST)" },
  { value: "/api/legal/admin/reingest-local", label: "Re-ingest Local (POST)" },
  { value: "/api/payment/history", label: "Payment History" },
  { value: "/api/payment/tiers", label: "Payment Tiers" },
  { value: "/api/membership-plans", label: "Membership Plans" },
  { value: "/api/order", label: "My Orders" },
  { value: "/api/book", label: "Book Catalog" },
  { value: "/api/shipping/cities", label: "Shipping Cities" },
];

function ApiTester() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/api/profile");
  const [bodyText, setBodyText] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendRequest() {
    setLoading(true);
    setResponse(null);
    const start = Date.now();

    try {
      let body: BodyInit | undefined;
      if (bodyText && ["POST", "PATCH", "PUT"].includes(method)) {
        JSON.parse(bodyText); // validate JSON first — throws if invalid
        body = bodyText;
      }

      // Auth ikut lewat cookie sesi (proxy memasang bearer ke backend).
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      setLatency(Date.now() - start);
      setStatus(res.status);
      const data = await res.json().catch(() => res.text());
      setResponse(data);
    } catch (err: unknown) {
      setLatency(Date.now() - start);
      setStatus(0);
      setResponse({ error: err instanceof Error ? err.message : "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Request panel */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon w-28"
          >
            {["GET", "POST", "PATCH", "DELETE"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            list="endpoints"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/endpoint"
            className="flex-1 bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon font-mono"
          />
          <datalist id="endpoints">
            {KNOWN_ENDPOINTS.map((e) => (
              <option key={e.value} value={e.value} label={e.label} />
            ))}
          </datalist>
        </div>

        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={8}
          placeholder={'JSON Body (untuk POST/PATCH):\n{\n  "key": "value"\n}'}
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-xs font-mono focus:outline-none focus:border-maroon resize-y"
        />

        <button
          onClick={sendRequest}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><LoadingSpinner size="sm" /> Mengirim...</> : "Kirim Request"}
        </button>
      </div>

      {/* Response panel */}
      <div className="bg-surface-2 border border-neutral-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-text-low text-xs uppercase tracking-wider">Response</span>
          {status !== null && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status >= 200 && status < 300 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
              {status}
            </span>
          )}
          {latency !== null && (
            <span className="text-text-low text-xs">{latency}ms</span>
          )}
        </div>
        <pre className="text-text-med text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap break-all">
          {response !== null
            ? JSON.stringify(response, null, 2)
            : "Menunggu request..."}
        </pre>
      </div>
    </div>
  );
}

// ─── Plagiarism Checker ────────────────────────────────────────────────────

function PlagiarismChecker() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ id?: number; status?: string; similarity?: number; report?: unknown } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await apiFetch<{ id?: number; status?: string; similarity?: number; report?: unknown }>(
        "/api/plagiarism/check",
        { method: "POST", body: JSON.stringify({ text }) }
      );

      // If status is "processing", poll for the result
      if (res.status === "processing" && res.id) {
        let attempts = 0;
        const maxAttempts = 20;
        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 3000));
          const statusRes = await apiFetch<{ status?: string; similarity?: number }>(
            `/api/plagiarism/status/${res.id}`
          );
          if (statusRes.status !== "processing") {
            setResult(statusRes);
            setLoading(false);
            return;
          }
          attempts++;
        }
        setError("Waktu habis — cek status secara manual.");
      } else {
        setResult(res);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memeriksa plagiarisme.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-text-low text-xs uppercase tracking-wider mb-1">Teks untuk Diperiksa</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste teks dokumen hukum yang ingin diperiksa plagiarismenya..."
          className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
        />
      </div>

      <button
        onClick={check}
        disabled={loading || !text.trim()}
        className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Memeriksa...</> : "Periksa Plagiarisme"}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>
      )}

      {result && (
        <div className="p-4 rounded-xl bg-surface-2 border border-neutral-200 space-y-2">
          <p className="text-text-low text-xs uppercase tracking-wider">Hasil Pemeriksaan</p>
          {result.similarity !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-text-med text-sm">Tingkat Kemiripan</span>
                <span className={`font-bold text-sm ${result.similarity > 30 ? "text-danger" : result.similarity > 15 ? "text-warning" : "text-success"}`}>
                  {result.similarity}%
                </span>
              </div>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${result.similarity > 30 ? "bg-danger" : result.similarity > 15 ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${Math.min(result.similarity, 100)}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-text-med text-xs">Status: {result.status ?? "Selesai"}</p>
          {result.report != null && (
            <pre className="text-text-low text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(result.report, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Testing Suite page ───────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "push", label: "Push Notifications", icon: <Smartphone size={16} /> },
  { id: "ai", label: "AI Features", icon: <Bot size={16} /> },
  { id: "api", label: "API Tester", icon: <Zap size={16} /> },
  { id: "plagiarism", label: "Plagiarism Checker", icon: <Search size={16} /> },
];

export default function TestingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif text-text-high">Admin Testing Suite</h1>
        <p className="text-text-med text-sm mt-0.5">
          Tool pengujian fitur backend Lexsee untuk administrator.
        </p>
      </div>

      {/* ── Tab navigation ───────────────────────────────────────────── */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-gold text-white"
                : "bg-surface-1 text-text-med hover:text-text-high border border-neutral-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Active tab content ────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-neutral-200 rounded-xl p-6">
        {activeTab === "push" && <PushNotifTester />}
        {activeTab === "ai" && <AiFeatureTester />}
        {activeTab === "api" && <ApiTester />}
        {activeTab === "plagiarism" && <PlagiarismChecker />}
      </div>
    </div>
  );
}
