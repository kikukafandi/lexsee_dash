"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function PlagiarismTester() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    const data = await apiFetch("/plagiarism/check", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setResult(data);
  };

  return (
    <div className="lux-card p-4 space-y-3">
      <div className="text-sm text-textMed">Plagiarism Checker</div>
      <textarea
        className="w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
        rows={4}
        placeholder="Paste text..."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button
        className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
        onClick={submit}
      >
        Check
      </button>
      {result && (
        <pre className="text-xs text-textMed whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
