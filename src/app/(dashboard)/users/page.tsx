"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { apiFetch } from "@/lib/api";
import type { AdminUser } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [membership, setMembership] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (membership && membership !== "ALL") {
      params.set("membership", membership);
    }
    apiFetch<{ users: AdminUser[] }>(`/admin/users?${params.toString()}`)
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, [membership]);

  const tierOptions = useMemo(() => ["ALL", "SILVER", "GOLD", "PLATINUM", "FREE"], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-textHigh">Users</h1>
        <select
          className="rounded-lg border border-dividerGold bg-white px-3 py-2 text-sm text-textMed"
          value={membership}
          onChange={(event) => setMembership(event.target.value)}
        >
          {tierOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={users}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "membershipTier", label: "Membership" },
          { key: "createdAt", label: "Created" },
        ]}
        emptyText="Belum ada data user."
      />
    </div>
  );
}
