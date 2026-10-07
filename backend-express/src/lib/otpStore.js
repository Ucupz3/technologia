// Simpan OTP di memory — hilang saat Express restart
// Format: Map<email, { code, expiresAt, userName }>
const store = new Map();

const TTL_MS = 5 * 60 * 1000; // 5 menit

export function saveOtp(email, code, userName) {
  store.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + TTL_MS,
    userName,
  });
}

export function verifyOtp(email, code) {
  const key = email.toLowerCase();
  const entry = store.get(key);

  if (!entry) return { ok: false, reason: 'not_found' };

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return { ok: false, reason: 'expired' };
  }

  if (entry.code !== code) {
    return { ok: false, reason: 'wrong' };
  }

  // Kode benar → hapus (sekali pakai)
  store.delete(key);
  return { ok: true, userName: entry.userName };
}

export function removeOtp(email) {
  store.delete(email.toLowerCase());
}

// Cleanup otomatis tiap 1 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60 * 1000);
