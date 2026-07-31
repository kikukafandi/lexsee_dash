// Cek cepat untuk helper murni notifikasi. Jalankan: node --test src/lib/notifications.test.mjs
// .mjs agar Node bisa menjalankannya langsung (type-stripping) tanpa test runner tambahan.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatMetadataValue,
  formatRupiah,
  formatTanggal,
  getMetadataLabel,
  isSafeInternalPath,
  METADATA_ROW_LIMIT,
  metadataRows,
  notifAction,
  notifMeta,
} from "./notifications.ts";

const base = {
  id: "1",
  type: "EXPERT_APPLICATION",
  title: "t",
  body: "b",
  isRead: false,
  createdAt: new Date().toISOString(),
};

test("formatRupiah memakai pemisah ribuan Indonesia tanpa desimal", () => {
  assert.equal(formatRupiah(5_000_000), "Rp5.000.000");
  assert.equal(formatRupiah(0), "Rp0");
  assert.equal(formatRupiah(1499.6), "Rp1.500");
});

test("formatTanggal memakai locale Indonesia", () => {
  // Dibangun dari komponen waktu lokal agar tidak bergantung zona waktu mesin.
  const iso = new Date(2026, 6, 29, 10, 30).toISOString();
  assert.equal(formatTanggal(iso, false), "29 Juli 2026");
  assert.match(formatTanggal(iso), /29 Juli 2026/);
  assert.equal(formatTanggal("bukan-tanggal"), "—");
});

test("tipe tak dikenal jatuh ke kategori Informasi tanpa error", () => {
  assert.equal(notifMeta("TIPE_MASA_DEPAN").category, "Informasi");
  assert.ok(notifMeta("TIPE_MASA_DEPAN").icon, "ikon default harus ada");
  assert.equal(notifAction({ ...base, type: "TIPE_MASA_DEPAN" }), null);
  assert.equal(notifMeta("INVOICE_PAID").category, "Invoice");
});

test("actionUrl backend menang atas fallback mapping tipe", () => {
  assert.equal(
    notifAction({ ...base, actionUrl: "/invoices/invoice-001", actionLabel: "Lihat Invoice" }).url,
    "/invoices/invoice-001",
  );
  // Notifikasi lama tanpa actionUrl → fallback mapping berdasarkan type.
  assert.deepEqual(notifAction(base), {
    label: "Lihat Pengajuan",
    url: "/expert-applications",
  });
  // Tanpa keduanya → tidak ada tombol tindakan.
  assert.equal(notifAction({ ...base, type: "SYSTEM_INFORMATION" }), null);
});

test("actionUrl eksternal ditolak, fallback tipe yang dipakai", () => {
  for (const actionUrl of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:void(0)"]) {
    assert.equal(isSafeInternalPath(actionUrl), false, actionUrl);
    assert.equal(notifAction({ ...base, actionUrl, actionLabel: "Klik" }).url, "/expert-applications");
  }
  assert.equal(isSafeInternalPath("/payments"), true);
});

test("actionLabel kosong tetap menghasilkan label yang terbaca", () => {
  assert.equal(notifAction({ ...base, actionUrl: "/payments", actionLabel: "  " }).label, "Buka");
});

test("label metadata diterjemahkan, key tak dikenal di-humanize", () => {
  assert.equal(getMetadataLabel("invoiceNumber"), "Nomor Invoice");
  assert.equal(getMetadataLabel("paymentDate"), "Tanggal Pembayaran");
  assert.equal(getMetadataLabel("projectName"), "Proyek");
  assert.equal(getMetadataLabel("someNewField"), "Some new field");
  assert.equal(getMetadataLabel("snake_case_key"), "Snake case key");
});

test("nilai metadata diformat sesuai nama key", () => {
  assert.equal(formatMetadataValue("amount", 5_000_000), "Rp5.000.000");
  assert.equal(formatMetadataValue("totalPrice", "250000"), "Rp250.000");
  assert.equal(formatMetadataValue("isVerified", true), "Ya");
  assert.equal(formatMetadataValue("isVerified", false), "Tidak");
  assert.equal(formatMetadataValue("status", "Lunas"), "Lunas");

  const localIso = new Date(2026, 6, 29, 10, 30).toISOString();
  // Pemisah jam antar-versi ICU berbeda ("," vs "pukul"), jadi cocokkan longgar.
  assert.match(formatMetadataValue("paymentDate", localIso), /^29 Juli 2026\b.*10\.30$/);
  assert.match(formatMetadataValue("dueDate", "2026-07-29"), /Juli 2026$/);
  // Angka murni bukan tanggal — jangan dipaksa jadi tanggal.
  assert.equal(formatMetadataValue("updatedAt", "2026"), "2026");
});

test("nilai kosong dan object kompleks tidak pernah dirender", () => {
  for (const empty of [null, undefined, "", "   "]) {
    assert.equal(formatMetadataValue("status", empty), "");
  }
  const complex = formatMetadataValue("payload", { a: { b: 1 } });
  assert.equal(complex, "");
  assert.ok(!complex.includes("[object Object]"));

  assert.equal(formatMetadataValue("tags", ["a", "b"]), "a, b");
  assert.equal(formatMetadataValue("items", [{ id: 1 }]), "");
});

test("metadataRows menyaring, memberi label, dan membatasi jumlah baris", () => {
  const rows = metadataRows({
    invoiceNumber: "INV-2026-001",
    projectName: "Website Company Profile",
    status: "Lunas",
    amount: 5_000_000,
    paymentDate: "2026-07-29",
    catatanKosong: "",
    objectRumit: { deep: { deeper: true } },
    tidakAda: null,
  });

  assert.deepEqual(
    rows.map((r) => r.label),
    ["Nomor Invoice", "Proyek", "Status", "Nominal", "Tanggal Pembayaran"],
  );
  assert.equal(rows.find((r) => r.key === "amount").value, "Rp5.000.000");

  // Notifikasi lama tanpa metadata tetap aman.
  assert.deepEqual(metadataRows(null), []);
  assert.deepEqual(metadataRows(undefined), []);

  const banyak = Object.fromEntries(
    Array.from({ length: METADATA_ROW_LIMIT + 8 }, (_, i) => [`field${i}`, `nilai ${i}`]),
  );
  assert.equal(metadataRows(banyak).length, METADATA_ROW_LIMIT);
});
