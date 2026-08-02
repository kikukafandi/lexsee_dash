// QA login dashboard di Chrome sungguhan, lewat DevTools Protocol.
//
// Yang tidak bisa dibuktikan curl: apakah aplikasinya benar-benar HIDUP setelah
// CSP nonce dipasang. curl hanya melihat HTML; kalau script diblokir browser,
// HTML-nya tetap terkirim utuh dan semua assertion curl tetap hijau sementara
// halamannya mati total bagi pengguna.
//
// Karena itu skenario di bawah menuntut React benar-benar berjalan: pesan error
// login hanya muncul kalau handler onSubmit hidup, dan redirect ke /overview
// hanya terjadi kalau router client bekerja.
//
// Dipanggil oleh scripts/test-login-browser.sh (yang menyiapkan server + Chrome).
// Butuh Node >= 22 (WebSocket global) — tanpa dependency sama sekali.

// Assertion di bawah ditulis sebagai `syarat ? ok(...) : bad(...)` — sengaja,
// karena tiap baris jadi terbaca sebagai satu pernyataan pengujian. Aturan
// no-unused-expressions menandai bentuk itu; dimatikan khusus di file ini.
/* eslint-disable @typescript-eslint/no-unused-expressions */

const APP = process.env.APP_URL ?? "http://127.0.0.1:3998";
const CDP = process.env.CDP_URL ?? "http://127.0.0.1:9222";

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  failed = 1;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Buka tab baru dan sambungkan WebSocket CDP-nya. */
async function connect() {
  const res = await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  return { send, events, close: () => ws.close() };
}

/** Nilai `value` yang di-set langsung tidak terlihat React; harus lewat setter
 *  native + event 'input' supaya state controlled component ikut berubah. */
const setInput = (selector, value) => `
  (() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return 'ELEMEN TIDAK ADA: ' + ${JSON.stringify(selector)};
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`;

async function main() {
  const { send, events, close } = await connect();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");

  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return r.result?.value;
  };

  const navigate = async (url) => {
    await send("Page.navigate", { url });
    await sleep(2500);
  };

  /** Semua error di console + exception yang tidak tertangkap, untuk diagnosa. */
  const semuaError = () =>
    events
      .filter(
        (e) =>
          (e.method === "Log.entryAdded" && e.params.entry.level === "error") ||
          (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") ||
          e.method === "Runtime.exceptionThrown",
      )
      .map((e) =>
        e.method === "Runtime.exceptionThrown"
          ? (e.params.exceptionDetails.exception?.description ??
            e.params.exceptionDetails.text)
          : (e.params.entry?.text ??
            e.params.args?.map((a) => a.value ?? a.description).join(" ")),
      );

  const cspViolations = () =>
    events
      .filter(
        (e) =>
          (e.method === "Log.entryAdded" &&
            /Content Security Policy|Refused to (execute|load)/i.test(
              e.params.entry.text ?? "",
            )) ||
          (e.method === "Runtime.consoleAPICalled" &&
            e.params.type === "error" &&
            /Content Security Policy/i.test(
              e.params.args?.map((a) => a.value).join(" ") ?? "",
            )),
      )
      .map((e) => e.params.entry?.text ?? "console error");

  console.log("\n1. Halaman login hidup di browser (bukan cuma terkirim)");
  await navigate(`${APP}/login`);

  const violations = cspViolations();
  violations.length === 0
    ? ok("tidak ada pelanggaran CSP di console")
    : bad(`CSP memblokir sesuatu:\n     ${violations.slice(0, 5).join("\n     ")}`);

  const judul = await evaluate("document.body.innerText.slice(0, 200)");
  /Selamat datang kembali/.test(judul ?? "")
    ? ok("form login ter-render")
    : bad(`isi halaman tak dikenali: ${JSON.stringify(judul)}`);

  console.log("\n2. React benar-benar terhidrasi (kredensial salah)");
  await evaluate(setInput('input[type="email"]', "admin@lexsee.id"));
  await evaluate(setInput('input[type="password"]', "salah"));
  const terisi = await evaluate(
    `document.querySelector('input[type="email"]').value`,
  );
  terisi === "admin@lexsee.id"
    ? ok("input terkendali React menerima nilai")
    : bad(`nilai input tidak tersimpan: ${JSON.stringify(terisi)}`);

  await evaluate(`document.querySelector('form button[type="submit"]').click()`);
  await sleep(2000);
  const teksError = await evaluate("document.body.innerText");
  /Kredensial salah/.test(teksError ?? "")
    ? ok("pesan error dari backend tampil — handler onSubmit hidup")
    : bad("pesan error tidak muncul; kemungkinan besar JavaScript tidak jalan");

  console.log("\n3. Login benar → masuk dashboard");
  await evaluate(setInput('input[type="password"]', "benar"));
  await evaluate(`document.querySelector('form button[type="submit"]').click()`);
  await sleep(4000);

  const url = await evaluate("location.pathname");
  url === "/overview"
    ? ok("berpindah ke /overview")
    : bad(`masih di ${url}`);

  // Yang diperiksa di sini HTML dari server, bukan isi halaman setelah data
  // dimuat: backend palsu tidak meniru bentuk data asli, jadi isi halaman akan
  // gagal karena backend-nya, bukan karena perubahan ini. Yang harus dibuktikan
  // adalah cookie HttpOnly benar-benar terkirim oleh browser dan server memakai
  // sesinya untuk merender identitas admin.
  const htmlDariServer = await evaluate(
    `fetch('/overview', { credentials: 'same-origin' })
       .then((r) => r.text())
       .then((t) => t.includes('Admin Uji'))`,
  );
  htmlDariServer === true
    ? ok("server merender identitas admin dari cookie yang dikirim browser")
    : bad(
        `HTML server tidak memuat profil admin. Error di console:\n     ${semuaError().slice(0, 4).join("\n     ")}`,
      );

  console.log("\n4. Inti WEB-01: token tidak terjangkau JavaScript");
  const cookieJs = await evaluate("document.cookie");
  !/lexsee_admin_session/.test(cookieJs ?? "")
    ? ok(`document.cookie tidak memuat sesi (isinya: ${JSON.stringify(cookieJs)})`)
    : bad("cookie sesi TERBACA JavaScript — HttpOnly tidak bekerja");

  const storage = await evaluate(
    "JSON.stringify({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })",
  );
  !/token/i.test(storage ?? "")
    ? ok(`tidak ada token di storage (${storage})`)
    : bad(`masih ada token di storage: ${storage}`);

  const pelanggaranAkhir = cspViolations();
  pelanggaranAkhir.length === 0
    ? ok("tidak ada pelanggaran CSP sepanjang alur")
    : bad(`CSP memblokir sesuatu:\n     ${pelanggaranAkhir.slice(0, 5).join("\n     ")}`);

  close();
  console.log(failed ? "\nADA YANG GAGAL." : "\nSEMUA LULUS.");
  process.exit(failed);
}

main().catch((err) => {
  console.error("Gagal menjalankan QA browser:", err.message);
  process.exit(1);
});
