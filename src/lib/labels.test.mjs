// Cek kamus label. Jalankan: node --test src/lib/labels.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { label, NAV_LABEL } from "./labels.ts";

test("kode dikenal", () => {
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
