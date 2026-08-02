// Backend NestJS palsu untuk test-auth-boundary.sh.
// Hanya cukup untuk menjawab login + profile, dan memantulkan header yang diterima
// sehingga test bisa membuktikan bearer token benar-benar sampai (atau tidak).
import http from "node:http";

const PORT = Number(process.env.FAKE_BACKEND_PORT ?? 3999);

const ADMIN = {
  id: "u1",
  email: "admin@lexsee.id",
  name: "Admin Uji",
  role: "ADMIN",
  interests: [],
  createdAt: "",
  updatedAt: "",
};
const USER = { ...ADMIN, id: "u2", email: "user@lexsee.id", role: "USER" };

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const auth = req.headers.authorization ?? null;
      const json = (code, obj) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(obj));
      };

      if (req.url === "/api/auth/login") {
        const b = JSON.parse(body || "{}");
        if (b.password !== "benar") return json(401, { message: "Kredensial salah" });
        const isUser = b.email === "user@lexsee.id";
        return json(200, {
          message: "ok",
          user: isUser ? USER : ADMIN,
          token: isUser ? "TOKEN_USER" : "TOKEN_ADMIN",
        });
      }

      if (req.url === "/api/profile") {
        if (auth === "Bearer TOKEN_ADMIN") return json(200, ADMIN);
        if (auth === "Bearer TOKEN_USER") return json(200, USER);
        return json(401, { message: "Unauthorized" });
      }

      // Dua endpoint khusus untuk test-auth-boundary.sh: pantulkan apa yang
      // diterima, supaya bisa dibuktikan bearer/XFF benar-benar sampai.
      if (req.url === "/api/apa-saja" || req.url === "/api/echo-xff") {
        return json(200, {
          url: req.url,
          method: req.method,
          authorization: auth,
          xff: req.headers["x-forwarded-for"] ?? null,
        });
      }

      // Sisanya: halaman dashboard memanggil banyak endpoint daftar sekaligus.
      // Balas kosong dengan bentuk yang benar, supaya halamannya tetap ter-render
      // dan test browser menguji halamannya, bukan backend palsunya.
      if (req.url?.startsWith("/api/legal/admin/stats")) {
        return json(200, { documents: 0, chunks: 0, peraturan: 0 });
      }
      if (req.url?.startsWith("/api/admin/users")) {
        return json(200, { users: [], total: 0 });
      }
      json(200, []);
    });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`fake backend on ${PORT}`));
