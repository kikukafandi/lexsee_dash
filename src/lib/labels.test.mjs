// Cek kamus label. Jalankan: node --test src/lib/labels.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { label, NAV_LABEL } from "./labels.ts";

test("kode dikenal", () => {
  assert.equal(label("paymentType", "AI_FEATURE"), "Kuota AI");
  assert.equal(label("withdrawal", "APPROVED"), "Disetujui, belum ditransfer");
  assert.equal(label("order", "SHIPPED"), "Dikirim");
  assert.equal(label("role", "EXPERT_HUKUM"), "Ahli Hukum");
  assert.equal(label("payment", "SUCCESS"), "Berhasil");
  assert.equal(label("consultation", "AWAITING_EXPERT"), "Menunggu jawaban");
  assert.equal(label("expertApplication", "PENDING"), "Menunggu tinjauan");
  assert.equal(label("docType", "PP"), "Peraturan Pemerintah (PP)");
});

test("kode tidak dikenal tetap terbaca", () => {
  assert.equal(label("order", "RETURNED"), "Status tidak dikenal (RETURNED)");
});

test("kosong", () => {
  assert.equal(label("order", null), "—");
  assert.equal(label("order", undefined), "—");
  assert.equal(label("order", ""), "—");
});

test("nama menu", () => {
  assert.equal(NAV_LABEL["/orders"], "Pesanan Buku");
  assert.equal(NAV_LABEL["/knowledge-base"], "Basis Pengetahuan AI");
});

import { pesanGalat } from "./labels.ts";

const apiErr = (message, status) => Object.assign(new Error(message), { name: "ApiError", status });

test("pesanGalat: sesi habis", () => {
  assert.equal(pesanGalat(apiErr("Unauthorized", 401), "menyimpan paket"), "Sesi berakhir, silakan masuk lagi.");
});
test("pesanGalat: ditolak dengan alasan server", () => {
  assert.equal(pesanGalat(apiErr("Tidak bisa mengubah peran sendiri", 403), "mengubah peran"), "Tidak bisa mengubah peran sendiri");
});
test("pesanGalat: server tidak terjangkau", () => {
  assert.match(pesanGalat(new TypeError("fetch failed"), "memuat data"), /^Server tidak terjangkau/);
  assert.match(pesanGalat(Object.assign(new Error("aborted"), { name: "AbortError" }), "memuat data"), /^Server tidak terjangkau/);
});
test("pesanGalat: validasi 400 memakai pesan server", () => {
  assert.equal(pesanGalat(apiErr("Nomor resi wajib diisi.", 400), "mengirim pesanan"), "Nomor resi wajib diisi.");
});
test("pesanGalat: 500 dan pesan teknis tidak ditampilkan mentah", () => {
  assert.equal(pesanGalat(apiErr("Internal server error", 500), "menyimpan paket"), "Gagal menyimpan paket. Server sedang bermasalah, coba lagi sebentar lagi.");
  assert.equal(pesanGalat(apiErr("Request failed with status 404", 404), "memuat data"), "Gagal memuat data. Data tidak ditemukan.");
});

import { aksiPesanan } from "./labels.ts";

test("aksiPesanan mengikuti alur status", () => {
  assert.deepEqual(aksiPesanan("PAID"), [
    { ke: "PROCESSING", tombol: "Proses" },
    { ke: "CANCELLED", tombol: "Batalkan" },
  ]);
  assert.deepEqual(aksiPesanan("PROCESSING"), [
    { ke: "SHIPPED", tombol: "Kirim" },
    { ke: "CANCELLED", tombol: "Batalkan" },
  ]);
  assert.deepEqual(aksiPesanan("SHIPPED"), [{ ke: "DELIVERED", tombol: "Tandai diterima" }]);
  for (const s of ["PENDING", "DELIVERED", "CANCELLED", "ANEH"]) assert.deepEqual(aksiPesanan(s), []);
});
