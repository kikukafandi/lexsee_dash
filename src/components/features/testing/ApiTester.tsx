"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

const endpoints = [
  "/auth/login",
  "/profile",
  "/legal/admin/stats",
  "/legal/peraturan",
  "/payment/history",
];

export default function ApiTester() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("");
  const [body, setBody] = useState("{}");
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState("");

  const send = async () => {
    try {
      const data = await apiFetch(endpoint, {
        method,
        body: ["POST", "PATCH", "PUT", "DELETE"].includes(method)
          ? body
          : undefined,
      });
      setResponse(data);
      setStatus("200");
    } catch (err: any) {
      setResponse(err?.data || err);
      setStatus(String(err?.status || "error"));
    }
  };

  return (
    <div className="lux-card p-4 space-y-3">
      <div className="flex gap-2">
        <select
          className="rounded-lg border border-borderGold bg-surface2 px-2 py-2 text-sm"
          value={method}
          onChange={(event) => setMethod(event.target.value)}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
        <input
          className="flex-1 rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
          list="endpoint-list"
          placeholder="/endpoint"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
        />
        <datalist id="endpoint-list">
          {endpoints.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>
      <textarea
        className="w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm"
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <button
        className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
        onClick={send}
      >
        Send
      </button>
      {status && <div className="text-xs text-textMed">Status: {status}</div>}
      {response && (
        <pre className="text-xs text-textMed whitespace-pre-wrap">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
