#!/usr/bin/env bash
# Batas auth dashboard (WEB-01/WEB-03) diuji terhadap server produksi sungguhan.
#
# Kenapa skrip, bukan unit test: yang perlu dibuktikan justru perilaku rangkaian
# proxy + rewrite + route handler, dan destinasi rewrite dipanggang saat build.
# Memalsukan salah satunya berarti menguji sesuatu yang bukan yang dideploy.
#
# Jalankan: bash scripts/test-auth-boundary.sh
# CATATAN: skrip ini menimpa .next dengan build yang mengarah ke backend palsu.
#          Jalankan `npm run build` lagi sebelum `npm start` sungguhan.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT=${PORT:-3998}
FAKE_BACKEND_PORT=${FAKE_BACKEND_PORT:-3999}
TMP=$(mktemp -d)
JAR="$TMP/cookies.txt"
FAILED=0

cleanup() {
  [[ -n "${NEXT_PID:-}" ]] && kill "$NEXT_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

ok() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1"; FAILED=1; }
check() { # check <deskripsi> <harapan> <kenyataan>
  if [[ "$2" == "$3" ]]; then ok "$1"; else fail "$1 — harap '$2', dapat '$3'"; fi
}
contains() { # contains <deskripsi> <substring> <teks>
  if [[ "$3" == *"$2"* ]]; then ok "$1"; else fail "$1 — '$2' tidak ada"; fi
}
lacks() {
  if [[ "$3" != *"$2"* ]]; then ok "$1"; else fail "$1 — '$2' seharusnya tidak ada"; fi
}

# Port yang sudah terpakai adalah cara skrip ini lolos diam-diam: `next start`
# gagal bind, curl menembak server lama, dan semua assertion hijau untuk kode
# yang bukan kode ini. Berhenti sebelum itu terjadi.
for p in "$PORT" "$FAKE_BACKEND_PORT"; do
  if curl -s -o /dev/null -m 2 "http://127.0.0.1:$p" 2>/dev/null; then
    echo "PORT $p sudah dipakai proses lain — hentikan dulu, kalau tidak skrip ini menguji server yang salah." >&2
    exit 1
  fi
done

echo "→ menyalakan backend palsu di :$FAKE_BACKEND_PORT"
FAKE_BACKEND_PORT=$FAKE_BACKEND_PORT node scripts/fake-backend.mjs >"$TMP/backend.log" 2>&1 &
BACKEND_PID=$!

echo "→ build (destinasi rewrite dipanggang saat build, jadi harus di sini)"
BACKEND_URL="http://127.0.0.1:$FAKE_BACKEND_PORT" npx next build >"$TMP/build.log" 2>&1 ||
  { cat "$TMP/build.log"; exit 1; }

echo "→ menyalakan next start di :$PORT"
BACKEND_URL="http://127.0.0.1:$FAKE_BACKEND_PORT" npx next start -p "$PORT" >"$TMP/next.log" 2>&1 &
NEXT_PID=$!
for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/login" 2>/dev/null && break
  sleep 1
done

B="http://127.0.0.1:$PORT"
echo
echo "1. Bearer token hanya lahir dari cookie sesi"
check "tanpa cookie: backend tidak menerima Authorization" \
  "(tidak ada)" "$(curl -fsS "$B/api/apa-saja" | python3 -c 'import json,sys;print(json.load(sys.stdin)["authorization"] or "(tidak ada)")')"
check "dengan cookie: backend menerima bearer dari cookie" \
  "Bearer T123" "$(curl -fsS -H 'Cookie: lexsee_admin_session=T123' "$B/api/apa-saja" | python3 -c 'import json,sys;print(json.load(sys.stdin)["authorization"] or "(tidak ada)")')"
check "Authorization karangan client ditimpa cookie" \
  "Bearer T123" "$(curl -fsS -H 'Cookie: lexsee_admin_session=T123' -H 'Authorization: Bearer PALSU' "$B/api/apa-saja" | python3 -c 'import json,sys;print(json.load(sys.stdin)["authorization"] or "(tidak ada)")')"
check "Authorization karangan tanpa cookie dibuang" \
  "(tidak ada)" "$(curl -fsS -H 'Authorization: Bearer PALSU' "$B/api/apa-saja" | python3 -c 'import json,sys;print(json.load(sys.stdin)["authorization"] or "(tidak ada)")')"
check "IP asli diteruskan (rate limit auth backend per IP)" \
  "203.0.113.9" "$(curl -fsS -H 'X-Forwarded-For: 203.0.113.9' "$B/api/echo-xff" | python3 -c 'import json,sys;print(json.load(sys.stdin)["xff"] or "(tidak diteruskan)")')"

echo
echo "2. Halaman dashboard tertutup di server, bukan setelah hydration"
check "/overview tanpa cookie → redirect" \
  "307" "$(curl -s -o /dev/null -w '%{http_code}' "$B/overview")"
check "redirect menuju /login" \
  "$B/login" "$(curl -s -o /dev/null -w '%{redirect_url}' "$B/overview")"
BODY=$(curl -s "$B/overview")
lacks "HTML halaman terproteksi tidak ikut terkirim" "Admin Uji" "$BODY"

echo
echo "3. Login menerbitkan cookie hanya untuk ADMIN"
LOGIN_SALAH=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@lexsee.id","password":"salah"}')
check "password salah → 401" "401" "$LOGIN_SALAH"
HDR_USER=$(curl -s -D - -o /dev/null -X POST "$B/auth/login" -H 'Content-Type: application/json' -d '{"email":"user@lexsee.id","password":"benar"}')
contains "role USER → 403" "403" "$(printf '%s' "$HDR_USER" | head -1)"
lacks "role USER tidak menerima cookie" "lexsee_admin_session" "$HDR_USER"
HDR_ADMIN=$(curl -s -D - -o /dev/null -c "$JAR" -X POST "$B/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@lexsee.id","password":"benar"}')
contains "ADMIN menerima cookie" "lexsee_admin_session=TOKEN_ADMIN" "$HDR_ADMIN"
contains "cookie HttpOnly (tak terbaca JavaScript — inti WEB-01)" "HttpOnly" "$HDR_ADMIN"
contains "cookie Secure di produksi" "Secure" "$HDR_ADMIN"
contains "cookie SameSite=lax (rem CSRF)" "SameSite=lax" "$HDR_ADMIN"

echo
echo "4. Sesi sah bisa masuk, logout mencabutnya"
OV=$(curl -s -b "$JAR" "$B/overview")
contains "/overview dirender server dengan profil admin" "Admin Uji" "$OV"
LOGOUT=$(curl -s -D - -o /dev/null -b "$JAR" -X POST "$B/auth/logout")
contains "logout menghapus cookie" "lexsee_admin_session=;" "$LOGOUT"

echo
echo "5. CSP nonce (WEB-02 lanjutan)"
CSP=$(curl -s -D - -o /dev/null -b "$JAR" "$B/overview" | grep -i '^content-security-policy:' || true)
contains "script-src memakai nonce" "'nonce-" "$CSP"
SCRIPT_SRC=$(printf '%s' "$CSP" | tr ';' '\n' | grep 'script-src')
lacks "script-src tanpa 'unsafe-inline'" "unsafe-inline" "$SCRIPT_SRC"
SCRIPTS_TANPA_NONCE=$(printf '%s' "$OV" | grep -o '<script[^>]*>' | grep -vc nonce || true)
check "semua <script> membawa nonce" "0" "$SCRIPTS_TANPA_NONCE"
N1=$(curl -s -D - -o /dev/null -b "$JAR" "$B/overview" | grep -io "nonce-[^']*" | head -1)
N2=$(curl -s -D - -o /dev/null -b "$JAR" "$B/overview" | grep -io "nonce-[^']*" | head -1)
if [[ "$N1" != "$N2" ]]; then ok "nonce berbeda tiap request"; else fail "nonce diulang antar request"; fi

echo
if [[ $FAILED -eq 0 ]]; then
  echo "SEMUA LULUS. Ingat: .next kini mengarah ke backend palsu — build ulang sebelum deploy."
else
  echo "ADA YANG GAGAL."
fi
exit $FAILED
