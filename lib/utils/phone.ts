// Validasi & normalisasi nomor HP Indonesia (PRD Bab F13).
// Format yang diterima: 08xx... atau +62 8xx... (spasi, strip, tanda kurung diabaikan).
// Hasil normalisasi: "62xxxxxxxxxx" — dipakai sebagai bentuk kanonik untuk
// identifier unik F14 (customer_phone di tabel submission).

const PHONE_PATTERN = /^(08\d{8,11}|\+?628\d{7,10})$/;

export function normalizeIndonesianPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (!PHONE_PATTERN.test(cleaned)) return null;
  if (cleaned.startsWith("08")) return `62${cleaned.slice(1)}`;
  return cleaned.replace(/^\+/, "");
}

export function isValidIndonesianPhone(raw: string): boolean {
  return normalizeIndonesianPhone(raw) !== null;
}
