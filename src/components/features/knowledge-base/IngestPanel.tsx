"use client";

import { useState } from "react";

export default function IngestPanel({
  onAuto,
  onManual,
  onSync,
  onReingest,
}: {
  onAuto: (payload: { keyword: string; docType: string; limit: number }) => void;
  onManual: (payload: { title: string; docType: string; text: string }) => void;
  onSync: () => void;
  onReingest: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [docType, setDocType] = useState("");
  const [limit, setLimit] = useState(10);
  const [title, setTitle] = useState("");
  const [manualType, setManualType] = useState("");
  const [text, setText] = useState("");

  return (
    <div className="lux-card p-4 space-y-6">
      <div>
        <div className="text-sm text-textMed">Auto Scrape (JDIH)</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
            placeholder="Keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <input
            className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
            placeholder="Doc Type"
            value={docType}
            onChange={(event) => setDocType(event.target.value)}
          />
          <input
            className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
            type="number"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
        </div>
        <button
          className="mt-3 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
          onClick={() => onAuto({ keyword, docType, limit })}
        >
          Start Scrape
        </button>
      </div>

      <div>
        <div className="text-sm text-textMed">Manual Upload</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
            placeholder="Doc Type"
            value={manualType}
            onChange={(event) => setManualType(event.target.value)}
          />
        </div>
        <textarea
          className="mt-3 w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
          rows={4}
          placeholder="Paste document text"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          className="mt-3 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
          onClick={() => onManual({ title, docType: manualType, text })}
        >
          Upload
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg border border-borderGold px-4 py-2 text-xs text-textHigh"
          onClick={onSync}
        >
          Sync Setneg
        </button>
        <button
          className="rounded-lg border border-borderGold px-4 py-2 text-xs text-textHigh"
          onClick={onReingest}
        >
          Re-ingest Local
        </button>
      </div>
    </div>
  );
}
