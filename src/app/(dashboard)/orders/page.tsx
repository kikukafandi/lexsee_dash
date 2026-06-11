"use client";

// Orders page — view book orders and the book catalog.
// Note: Only shows the admin user's own orders.
// A future /api/admin/orders endpoint would be needed for all-user data.

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge, orderStatusVariant } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Order, Book } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [ordersData, booksData] = await Promise.all([
          apiFetch<Order[]>("/api/order"),
          apiFetch<Book[]>("/api/book"),
        ]);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setBooks(Array.isArray(booksData) ? booksData : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const orderColumns: Column<Order>[] = [
    {
      header: "ID Order",
      accessor: "id",
      render: (row) => (
        <span className="text-text-low text-xs font-mono">{row.id.slice(0, 12)}...</span>
      ),
    },
    {
      header: "Penerima",
      accessor: "recipientName",
      render: (row) => (
        <div>
          <p className="text-text-high text-sm font-medium">{row.recipientName}</p>
          <p className="text-text-low text-xs">{row.phone}</p>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "totalAmount",
      render: (row) => (
        <span className="text-gold font-semibold text-sm">
          Rp {Number(row.totalAmount).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Kurir",
      accessor: "courierName",
      render: (row) => (
        <span className="text-text-med text-xs">
          {row.courierName ?? "—"} {row.courierService ?? ""}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={orderStatusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: "Tanggal",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-text-med text-xs">
          {new Date(row.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const bookColumns: Column<Book>[] = [
    {
      header: "Judul",
      accessor: "title",
      render: (row) => (
        <div>
          <p className="text-text-high text-sm font-medium">{row.title}</p>
          <p className="text-text-low text-xs">{row.author ?? "—"}</p>
        </div>
      ),
      width: "w-2/5",
    },
    {
      header: "ISBN",
      accessor: "isbn",
      render: (row) => (
        <span className="text-text-med text-xs font-mono">{row.isbn ?? "—"}</span>
      ),
    },
    {
      header: "Harga",
      accessor: "price",
      render: (row) => (
        <span className="text-gold font-semibold text-sm">
          Rp {Number(row.price).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Stok",
      accessor: "stock",
      render: (row) => (
        <Badge variant={row.stock > 5 ? "success" : row.stock > 0 ? "warning" : "danger"}>
          {row.stock} pcs
        </Badge>
      ),
    },
    {
      header: "Berat",
      accessor: "weight",
      render: (row) => (
        <span className="text-text-med text-xs">{row.weight}g</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif text-text-high">Orders & Books</h1>
        <p className="text-text-med text-sm mt-0.5">
          Manajemen pesanan buku fisik dan katalog buku.
        </p>
      </div>

      {/* Backend limitation notice */}
      <div className="p-3 rounded-lg bg-surface-2 border border-gold/15 text-text-med text-xs">
        ℹ️ Menampilkan order akun admin saat ini. Endpoint admin untuk semua pengguna
        (<code className="text-gold">/api/admin/orders</code>) belum tersedia di backend.
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          <AlertTriangle size={16} className="inline shrink-0" /> {error}
        </div>
      )}

      {/* ── Summary ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-4 text-center">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">Total Order</p>
          <p className="text-gold text-3xl font-serif font-bold">{orders.length}</p>
        </div>
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-4 text-center">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">Total Buku</p>
          <p className="text-gold text-3xl font-serif font-bold">{books.length}</p>
        </div>
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-4 text-center">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">Stok Kritis</p>
          <p className="text-warning text-3xl font-serif font-bold">
            {books.filter((b) => b.stock <= 5).length}
          </p>
        </div>
      </div>

      {/* ── Orders table ──────────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-gold/25 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gold/15">
          <h2 className="text-text-high font-serif text-lg">Daftar Order</h2>
        </div>
        <DataTable
          columns={orderColumns}
          data={orders}
          emptyMessage="Belum ada order"
          emptyDescription="Order pembelian buku akan muncul di sini."
        />
      </div>

      {/* ── Book catalog table ────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-gold/25 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gold/15">
          <h2 className="text-text-high font-serif text-lg">Katalog Buku</h2>
        </div>
        <DataTable
          columns={bookColumns}
          data={books}
          emptyMessage="Belum ada buku"
          emptyDescription="Tambahkan buku melalui backend API."
        />
      </div>
    </div>
  );
}
