"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import type { BookItem, OrderItem } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);

  useEffect(() => {
    apiFetch<OrderItem[]>("/order")
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));

    apiFetch<BookItem[]>("/book")
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setBooks([]));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl text-textHigh">Orders</h1>
      <DataTable
        data={orders}
        columns={[
          { key: "id", label: "Order ID" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Created" },
        ]}
        emptyText="Belum ada order admin."
      />

      <div className="space-y-3">
        <h2 className="text-lg text-textHigh">Book Catalog</h2>
        <DataTable
          data={books}
          columns={[
            { key: "title", label: "Title" },
            { key: "stock", label: "Stock" },
            { key: "price", label: "Price" },
          ]}
          emptyText="Belum ada data buku."
        />
      </div>
    </div>
  );
}
