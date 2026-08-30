// Helper tampilan bersama halaman admin (label, format tanggal).
// Murni — boleh dipakai server maupun client component.

export const PERSONA_LABELS: Record<string, string> = {
  THE_ARCHITECT: "The Architect",
  THE_BUILDER: "The Builder",
  THE_EXPLORER: "The Explorer",
  THE_ADVENTURER: "The Adventurer",
  THE_STARTER: "The Starter",
};

export function personaLabel(persona: string | null): string {
  if (!persona) return "—";
  return PERSONA_LABELS[persona] ?? persona.replace(/_/g, " ");
}

export const RECOMMENDATION_LABELS: Record<string, string> = {
  KSM: "KSM",
  KPR: "KPR",
  KKB: "KKB",
  CASA: "CASA/Tabungan",
  LIVIN: "Livin'",
  DEBT_ADVICE: "Arahan Kelola Utang",
  FINANCIAL_ADVICE: "Arahan Finansial",
};

export function recommendationLabel(key: string | null): string {
  if (!key) return "—";
  return RECOMMENDATION_LABELS[key] ?? key;
}

export const ASSESSMENT_LABELS: Record<string, string> = {
  RATING: "Financial Health",
  NEEDS: "Kebutuhan Kredit",
};

export function assessmentLabel(type: string | null): string {
  if (!type) return "—";
  return ASSESSMENT_LABELS[type] ?? type;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_FORMATTER.format(date);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTER.format(date);
}

/** Tampilkan nomor HP tersimpan (62xxxxxxxxxx) dalam format lokal 08xx. */
export function displayPhone(phone: string | null): string {
  if (!phone) return "—";
  if (phone.startsWith("62")) return `0${phone.slice(1)}`;
  return phone;
}
