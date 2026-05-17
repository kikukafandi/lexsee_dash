"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import KbStatsRow from "@/components/features/knowledge-base/KbStatsRow";
import DocumentTable from "@/components/features/knowledge-base/DocumentTable";
import IngestPanel from "@/components/features/knowledge-base/IngestPanel";
import type { AdminStats, DocumentItem } from "@/types";

export default function KnowledgeBasePage() {
  const [stats, setStats] = useState<AdminStats>({});
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const helpfulRate = (() => {
    const helpful = stats.feedback?.helpful || 0;
    const notHelpful = stats.feedback?.notHelpful || 0;
    const total = helpful + notHelpful;
    if (!total) return 0;
    return Math.round((helpful / total) * 100);
  })();

  const load = () => {
    apiFetch<AdminStats>("/legal/admin/stats")
      .then(setStats)
      .catch(() => setStats({}));

    apiFetch<DocumentItem[]>("/legal/admin/documents")
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => setDocuments([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    await apiFetch(`/legal/admin/documents/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl text-textHigh">Knowledge Base</h1>
      <KbStatsRow
        stats={{
          documents: stats.documents?.active || 0,
          chunks: stats.chunks || 0,
          sessions: stats.sessions || 0,
          helpfulRate,
          negative: stats.feedback?.notHelpful || 0,
        }}
      />
      <DocumentTable data={documents} onDelete={handleDelete} />
      <IngestPanel
        onAuto={(payload) =>
          apiFetch("/legal/ingest", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        }
        onManual={(payload) =>
          apiFetch("/legal/ingest", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        }
        onSync={() => apiFetch("/legal/admin/sync-setneg", { method: "POST" })}
        onReingest={() =>
          apiFetch("/legal/admin/reingest-local", { method: "POST" })
        }
      />
    </div>
  );
}
