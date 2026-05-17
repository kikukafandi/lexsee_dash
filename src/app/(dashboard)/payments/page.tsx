"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import type { MembershipTier, PaymentHistoryItem } from "@/types";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);

  useEffect(() => {
    apiFetch<PaymentHistoryItem[]>("/payment/history")
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]));

    apiFetch<MembershipTier[]>("/payment/tiers")
      .then((data) => setTiers(Array.isArray(data) ? data : []))
      .catch(() => setTiers([]));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl text-textHigh">Payments</h1>
      <DataTable
        data={payments}
        columns={[
          { key: "id", label: "ID" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Created" },
        ]}
        emptyText="Tidak ada data pembayaran admin."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="lux-card p-4">
            <div className="text-sm text-textMed">{tier.name}</div>
            <div className="mt-2 text-2xl text-gold">
              {tier.price || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
