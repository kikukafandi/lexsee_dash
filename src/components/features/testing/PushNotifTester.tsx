"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function PushNotifTester() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");

  const send = async () => {
    setStatus("Sending...");
    try {
      await apiFetch("/notifications/test", {
        method: "POST",
        body: JSON.stringify({ title, body, token }),
      });
      setStatus("Sent.");
    } catch (err: any) {
      setStatus(
        err?.status === 404
          ? "Push notification backend belum tersedia."
          : "Gagal mengirim.",
      );
    }
  };

  return (
    <div className="lux-card p-4 space-y-3">
      <div className="text-sm text-textMed">Push Notification Tester</div>
      <input
        className="w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <input
        className="w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
        placeholder="Body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <input
        className="w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
        placeholder="FCM Token (optional)"
        value={token}
        onChange={(event) => setToken(event.target.value)}
      />
      <button
        className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
        onClick={send}
      >
        Send Test Push
      </button>
      {status && <p className="text-xs text-textMed">{status}</p>}
    </div>
  );
}
