"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AiFeatureTester() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<any>(null);

  const send = async () => {
    const data = await apiFetch("/legal/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    setResponse(data);
  };

  return (
    <div className="lux-card p-4 space-y-3">
      <div className="text-sm text-textMed">Chat Tester</div>
      <textarea
        className="w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
        rows={3}
        placeholder="Ask Lexsee..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
        onClick={send}
      >
        Send
      </button>
      {response && (
        <pre className="text-xs text-textMed whitespace-pre-wrap">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
