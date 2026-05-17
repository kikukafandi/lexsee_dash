"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { PeraturanItem } from "@/types";
import PeraturanFilters from "@/components/features/legal-catalog/PeraturanFilters";
import PeraturanTable from "@/components/features/legal-catalog/PeraturanTable";
import PdfPreviewModal from "@/components/features/legal-catalog/PdfPreviewModal";

export default function LegalCatalogPage() {
  const [items, setItems] = useState<PeraturanItem[]>([]);
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState("");
  const [tahun, setTahun] = useState("");
  const [selected, setSelected] = useState<PeraturanItem | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "10");
    if (search) params.set("q", search);
    if (jenis) params.set("jenis", jenis);
    if (tahun) params.set("tahun", tahun);

    try {
      const data = await apiFetch<any>(`/legal/peraturan?${params.toString()}`);
      const rows = data?.data || data?.items || data || [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, jenis, tahun]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiFetch("/legal/admin/sync-setneg", { method: "POST" });
      fetchData();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-textHigh">Legal Catalog</h1>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-borderGold px-4 py-2 text-xs text-textHigh"
            onClick={fetchData}
          >
            Refresh
          </button>
          <button
            className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync Setneg"}
          </button>
        </div>
      </div>
      <PeraturanFilters
        search={search}
        onSearch={setSearch}
        jenis={jenis}
        onJenis={setJenis}
        tahun={tahun}
        onTahun={setTahun}
      />
      <PeraturanTable data={items} onPreview={setSelected} />
      <PdfPreviewModal
        open={Boolean(selected)}
        item={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
