"use client";

// OnlineUsersCard — menampilkan user yang sedang online (real-time, polling).
// Data dari GET /api/chat/online (in-memory presence dari WebSocket gateway).

import { useEffect, useState } from "react";
import { Circle } from "lucide-react";
import { apiFetch } from "@/lib/api";

type OnlineUser = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  role: string;
};
type OnlineResponse = { count: number; users: OnlineUser[] };

function initials(name: string) {
  return (name || "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function OnlineUsersCard() {
  const [data, setData] = useState<OnlineResponse>({ count: 0, users: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await apiFetch<OnlineResponse>("/api/chat/online");
        if (alive && res) setData(res);
      } catch {
        // diamkan — endpoint mungkin belum tersedia / tidak ada yang online
      } finally {
        if (alive) setLoaded(true);
      }
    }
    load();
    const t = setInterval(load, 20000); // refresh tiap 20 detik
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="bg-surface-1 border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Circle size={10} className="fill-success text-success" />
          <h2 className="text-text-high font-semibold">Pengguna Online</h2>
        </div>
        <span className="text-2xl font-semibold text-text-high tabular-nums">
          {data.count}
        </span>
      </div>

      {!loaded ? (
        <p className="text-text-low text-sm">Memuat…</p>
      ) : data.users.length === 0 ? (
        <p className="text-text-low text-sm">Tidak ada pengguna online saat ini.</p>
      ) : (
        <ul className="space-y-2.5 max-h-64 overflow-y-auto">
          {data.users.map((u) => (
            <li key={u.id} className="flex items-center gap-3">
              <div className="relative shrink-0">
                {u.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.photoUrl}
                    alt={u.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-2 text-text-med flex items-center justify-center text-xs font-semibold">
                    {initials(u.name)}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-white" />
              </div>
              <div className="min-w-0">
                <p className="text-text-high text-sm font-medium truncate">{u.name}</p>
                <p className="text-text-low text-xs truncate">{u.email}</p>
              </div>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-text-low">
                {u.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
