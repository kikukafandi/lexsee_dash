"use client";

// Webinars page — admin melihat SEMUA event termasuk DRAFT.
// Alur: expert membuat DRAFT → admin mengisi link Zoom → admin publish.

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Loader2,
  Radio,
  RefreshCw,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

type WebinarExpert = {
  id: string;
  name: string;
};

type Webinar = {
  id: string;
  title: string;
  price: number;
  scheduledAt: string;
  status: string;
  maxParticipants?: number | null;
  zoomJoinUrl?: string | null;
  zoomPasscode?: string | null;
  expert?: WebinarExpert | null;
  _count?: {
    tickets: number;
  };
};

function rupiah(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function tanggal(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal tidak valid";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(
  status: string,
): "success" | "warning" | "info" | "default" {
  if (status === "LIVE") return "success";
  if (status === "PUBLISHED") return "info";
  if (status === "DRAFT") return "warning";

  return "default";
}

function statusLabel(status: string) {
  if (status === "LIVE") return "Live";
  if (status === "PUBLISHED") return "Terbit";
  if (status === "DRAFT") return "Draf";

  return status;
}

export default function WebinarsPage() {
  const [items, setItems] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Webinar | null>(null);
  const [zoomUrl, setZoomUrl] = useState("");
  const [zoomPass, setZoomPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await apiFetch<Webinar[]>(
        "/api/webinar/admin/events",
      );

      setItems(Array.isArray(response) ? response : []);
      setError("");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data webinar.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalWebinars = items.length;

  const liveCount = items.filter(
    (webinar) => webinar.status === "LIVE",
  ).length;

  const missingZoomCount = items.filter(
    (webinar) => !webinar.zoomJoinUrl?.trim(),
  ).length;

  const draftCount = items.filter(
    (webinar) => webinar.status === "DRAFT",
  ).length;

  function openEditor(webinar: Webinar) {
    setEditing(webinar);
    setZoomUrl(webinar.zoomJoinUrl ?? "");
    setZoomPass(webinar.zoomPasscode ?? "");
    setModalError("");
  }

  function closeEditor() {
    if (saving) return;

    setEditing(null);
    setZoomUrl("");
    setZoomPass("");
    setModalError("");
  }

  async function saveZoom() {
    if (!editing || saving) return;

    const cleanZoomUrl = zoomUrl.trim();
    const cleanZoomPasscode = zoomPass.trim();

    if (!cleanZoomUrl) {
      setModalError("Link Zoom wajib diisi.");
      return;
    }

    if (
      !cleanZoomUrl.startsWith("https://") &&
      !cleanZoomUrl.startsWith("http://")
    ) {
      setModalError(
        "Link Zoom harus diawali dengan http:// atau https://.",
      );
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      await apiFetch(
        `/api/webinar/admin/events/${editing.id}/zoom`,
        {
          method: "PATCH",
          body: JSON.stringify({
            zoomJoinUrl: cleanZoomUrl,
            zoomPasscode: cleanZoomPasscode || undefined,
          }),
        },
      );

      setEditing(null);
      setZoomUrl("");
      setZoomPass("");
      await load();
    } catch (err: unknown) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan link Zoom.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publish(webinar: Webinar) {
    if (publishingId) return;

    if (!webinar.zoomJoinUrl?.trim()) {
      setError(
        `Webinar "${webinar.title}" belum memiliki link Zoom.`,
      );
      return;
    }

    setPublishingId(webinar.id);
    setError("");

    try {
      await apiFetch(
        `/api/webinar/events/${webinar.id}/publish`,
        {
          method: "POST",
        },
      );

      await load();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menerbitkan webinar.",
      );
    } finally {
      setPublishingId(null);
    }
  }

  const columns: Column<Webinar>[] = [
    {
      header: "Webinar",
      accessor: "title",
      render: (row) => (
        <div className="max-w-[300px]">
          <p className="truncate font-semibold text-text-high">
            {row.title}
          </p>

          <p className="mt-1 truncate text-xs text-text-low">
            {row.expert?.name ?? "Expert tidak tersedia"}
          </p>
        </div>
      ),
    },
    {
      header: "Jadwal",
      accessor: "scheduledAt",
      render: (row) => (
        <div className="flex min-w-[180px] items-start gap-2">
          <CalendarDays
            size={15}
            className="mt-0.5 shrink-0 text-text-low"
          />

          <span className="text-sm leading-5 text-text-med">
            {tanggal(row.scheduledAt)}
          </span>
        </div>
      ),
    },
    {
      header: "Harga",
      accessor: "price",
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-semibold text-text-high">
          {Number(row.price) > 0
            ? rupiah(Number(row.price))
            : "Gratis"}
        </span>
      ),
    },
    {
      header: "Peserta",
      accessor: "_count",
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-text-med">
          <Users size={15} className="text-text-low" />

          <span className="whitespace-nowrap">
            {row._count?.tickets ?? 0}
            {row.maxParticipants
              ? ` / ${row.maxParticipants}`
              : ""}
          </span>
        </div>
      ),
    },
    {
      header: "Zoom",
      accessor: "zoomJoinUrl",
      render: (row) =>
        row.zoomJoinUrl?.trim() ? (
          <Badge variant="success">
            <span className="inline-flex items-center gap-1.5">
              <Video size={12} />
              Terisi
            </span>
          </Badge>
        ) : (
          <Badge variant="warning">
            <span className="inline-flex items-center gap-1.5">
              <VideoOff size={12} />
              Belum diisi
            </span>
          </Badge>
        ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={statusVariant(row.status)}>
          {statusLabel(row.status)}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (row) => {
        const hasZoom = Boolean(row.zoomJoinUrl?.trim());
        const isPublishing = publishingId === row.id;

        return (
          <div className="flex min-w-max items-center gap-2">
            <button
              type="button"
              onClick={() => openEditor(row)}
              className="
                inline-flex h-9 items-center justify-center gap-1.5
                rounded-lg border border-neutral-300
                bg-surface-1 px-3
                text-xs font-semibold text-text-high
                transition-colors
                hover:border-primary/40 hover:bg-surface-2
                focus:outline-none focus:ring-2 focus:ring-primary/20
              "
            >
              <Video size={14} />

              {hasZoom ? "Ubah Zoom" : "Isi Zoom"}
            </button>

            {row.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => void publish(row)}
                disabled={!hasZoom || isPublishing}
                title={
                  !hasZoom
                    ? "Isi link Zoom terlebih dahulu"
                    : "Terbitkan webinar"
                }
                className="
                  inline-flex h-9 items-center justify-center gap-1.5
                  rounded-lg bg-primary px-3
                  text-xs font-semibold text-white
                  shadow-sm transition-all
                  hover:bg-primary/90
                  focus:outline-none focus:ring-2 focus:ring-primary/30
                  disabled:cursor-not-allowed disabled:opacity-40
                "
              >
                {isPublishing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Radio size={14} />
                )}

                {isPublishing ? "Memproses" : "Publish"}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-high">
            Webinar
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-med">
            Kelola semua webinar, lengkapi link Zoom, dan
            terbitkan event yang sudah siap.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="
            inline-flex h-10 items-center justify-center gap-2
            self-start rounded-lg border border-neutral-300
            bg-surface-1 px-4
            text-sm font-semibold text-text-high
            transition-colors
            hover:bg-surface-2
            focus:outline-none focus:ring-2 focus:ring-primary/20
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          Muat Ulang
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Webinar"
          value={totalWebinars}
          icon={<Video size={18} />}
          iconClassName="bg-primary/10 text-primary"
        />

        <StatCard
          label="Sedang Live"
          value={liveCount}
          icon={<Radio size={18} />}
          iconClassName="bg-success/10 text-success"
        />

        <StatCard
          label="Belum Ada Zoom"
          value={missingZoomCount}
          icon={<VideoOff size={18} />}
          iconClassName="bg-warning/10 text-warning"
        />

        <StatCard
          label="Masih Draf"
          value={draftCount}
          icon={<AlertTriangle size={18} />}
          iconClassName="bg-neutral-100 text-text-med"
        />
      </section>

      {error ? (
        <section
          className="
            flex items-start gap-3 rounded-xl
            border border-danger/20 bg-danger/5
            px-5 py-4 text-sm text-danger
          "
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Terjadi kesalahan
            </p>

            <p className="mt-0.5 leading-5">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="
              rounded-md p-1
              text-danger/70 transition-colors
              hover:bg-danger/10 hover:text-danger
            "
            aria-label="Tutup pesan error"
          >
            <X size={16} />
          </button>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-surface-1">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="font-semibold text-text-high">
            Daftar Webinar
          </h2>

          <p className="mt-1 text-xs text-text-low">
            Semua webinar dari expert ditampilkan di sini.
          </p>
        </div>

        <div className="p-2">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="Belum ada webinar"
            emptyDescription="Event yang dibuat expert akan muncul di sini."
          />
        </div>
      </section>

      {editing && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/50 p-4 backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
            }
          }}
        >
          <div
            className="
              w-full max-w-md overflow-hidden
              rounded-2xl border border-neutral-200
              bg-surface-1 shadow-2xl
            "
          >
            <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <div
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-lg bg-primary/10 text-primary
                    "
                  >
                    <Video size={18} />
                  </div>

                  <h2 className="text-lg font-semibold text-text-high">
                    Link Zoom
                  </h2>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-5 text-text-med">
                  {editing.title}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="
                  rounded-lg p-2 text-text-low
                  transition-colors
                  hover:bg-surface-2 hover:text-text-high
                  disabled:cursor-not-allowed disabled:opacity-50
                "
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <label
                  htmlFor="zoom-url"
                  className="text-sm font-semibold text-text-high"
                >
                  Zoom Join URL
                </label>

                <input
                  id="zoom-url"
                  type="url"
                  value={zoomUrl}
                  onChange={(event) => {
                    setZoomUrl(event.target.value);

                    if (modalError) {
                      setModalError("");
                    }
                  }}
                  placeholder="https://zoom.us/j/123456789"
                  autoFocus
                  className="
                    h-11 w-full rounded-lg
                    border border-neutral-300
                    bg-surface-2 px-3
                    text-sm text-text-high
                    outline-none transition-all
                    placeholder:text-text-low
                    focus:border-primary
                    focus:bg-surface-1
                    focus:ring-4 focus:ring-primary/10
                  "
                />

                <p className="text-xs leading-5 text-text-low">
                  Masukkan link yang dapat digunakan peserta untuk
                  bergabung ke webinar.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="zoom-passcode"
                  className="text-sm font-semibold text-text-high"
                >
                  Passcode
                  <span className="ml-1 font-normal text-text-low">
                    opsional
                  </span>
                </label>

                <input
                  id="zoom-passcode"
                  type="text"
                  value={zoomPass}
                  onChange={(event) => {
                    setZoomPass(event.target.value);

                    if (modalError) {
                      setModalError("");
                    }
                  }}
                  placeholder="Contoh: 12345"
                  className="
                    h-11 w-full rounded-lg
                    border border-neutral-300
                    bg-surface-2 px-3
                    text-sm text-text-high
                    outline-none transition-all
                    placeholder:text-text-low
                    focus:border-primary
                    focus:bg-surface-1
                    focus:ring-4 focus:ring-primary/10
                  "
                />
              </div>

              {modalError && (
                <div
                  className="
                    flex items-start gap-2.5 rounded-lg
                    border border-danger/20 bg-danger/5
                    px-3 py-2.5 text-sm text-danger
                  "
                >
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="leading-5">
                    {modalError}
                  </span>
                </div>
              )}
            </div>

            <div
              className="
                flex items-center justify-end gap-3
                border-t border-neutral-200
                bg-surface-2/60 px-6 py-4
              "
            >
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="
                  inline-flex h-10 items-center justify-center
                  rounded-lg border border-neutral-300
                  bg-surface-1 px-4
                  text-sm font-semibold text-text-high
                  transition-colors
                  hover:bg-neutral-50
                  focus:outline-none focus:ring-2 focus:ring-neutral-300
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => void saveZoom()}
                disabled={saving || !zoomUrl.trim()}
                className="
                  inline-flex h-10 min-w-[120px]
                  items-center justify-center gap-2
                  rounded-lg
                  bg-primary px-5
                  text-sm font-semibold text-white
                  shadow-sm transition-all
                  hover:bg-primary/90 hover:shadow-md
                  focus:outline-none focus:ring-4 focus:ring-primary/20
                  disabled:cursor-not-allowed
                  disabled:bg-neutral-300
                  disabled:text-neutral-500
                  disabled:shadow-none
                "
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Menyimpan
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Simpan Zoom
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
};

function StatCard({
  label,
  value,
  icon,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-xl border border-neutral-200
        bg-surface-1 p-5
        transition-shadow hover:shadow-sm
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-low">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-text-high">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}