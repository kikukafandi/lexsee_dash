#!/usr/bin/env bash
# Menyiapkan backend palsu + build produksi + Chrome headless, lalu menjalankan
# skenario QA login di scripts/test-login-browser.mjs.
#
# Jalankan: bash scripts/test-login-browser.sh
# CATATAN: menimpa .next dengan build yang mengarah ke backend palsu.
#          Jalankan `npm run build` lagi sebelum `npm start` sungguhan.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT=${PORT:-3998}
FAKE_BACKEND_PORT=${FAKE_BACKEND_PORT:-3999}
CDP_PORT=${CDP_PORT:-9222}
TMP=$(mktemp -d)

cleanup() {
  [[ -n "${CHROME_PID:-}" ]] && kill "$CHROME_PID" 2>/dev/null || true
  [[ -n "${NEXT_PID:-}" ]] && kill "$NEXT_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  sleep 1 # Chrome masih menulis ke profilnya sesaat setelah dimatikan.
  rm -rf "$TMP"
}
trap cleanup EXIT

CHROME=$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)
[[ -z "$CHROME" ]] && { echo "Chrome/Chromium tidak ditemukan." >&2; exit 1; }

# Port sibuk = skrip menguji server orang lain dan melaporkan hijau. Lihat §14.
for p in "$PORT" "$FAKE_BACKEND_PORT" "$CDP_PORT"; do
  if curl -s -o /dev/null -m 2 "http://127.0.0.1:$p" 2>/dev/null; then
    echo "PORT $p sudah dipakai proses lain — hentikan dulu." >&2
    exit 1
  fi
done

echo "→ backend palsu :$FAKE_BACKEND_PORT"
FAKE_BACKEND_PORT=$FAKE_BACKEND_PORT node scripts/fake-backend.mjs >"$TMP/backend.log" 2>&1 &
BACKEND_PID=$!

echo "→ build"
BACKEND_URL="http://127.0.0.1:$FAKE_BACKEND_PORT" npx next build >"$TMP/build.log" 2>&1 ||
  { cat "$TMP/build.log"; exit 1; }

echo "→ next start :$PORT"
BACKEND_URL="http://127.0.0.1:$FAKE_BACKEND_PORT" npx next start -p "$PORT" >"$TMP/next.log" 2>&1 &
NEXT_PID=$!
for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/login" 2>/dev/null && break
  sleep 1
done

# Profil sementara: tidak menyentuh Chrome milik user sama sekali.
echo "→ chrome headless :$CDP_PORT"
"$CHROME" --headless=new --disable-gpu --no-first-run \
  --user-data-dir="$TMP/chrome-profile" \
  --remote-debugging-port="$CDP_PORT" \
  --remote-allow-origins="http://127.0.0.1:$CDP_PORT" \
  about:blank >"$TMP/chrome.log" 2>&1 &
CHROME_PID=$!
for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "http://127.0.0.1:$CDP_PORT/json/version" 2>/dev/null && break
  sleep 1
done

APP_URL="http://127.0.0.1:$PORT" CDP_URL="http://127.0.0.1:$CDP_PORT" \
  node scripts/test-login-browser.mjs
