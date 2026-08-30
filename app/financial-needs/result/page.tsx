import type { Metadata } from "next";
import { Suspense } from "react";
import NeedsResultClient from "./needs-result-client";

export const metadata: Metadata = {
  title: "Hasil Kebutuhan Kredit · Livin' Financial Wellness",
  description:
    "Lihat produk kredit yang paling relevan untukmu — KSM, KPR, atau KKB — beserta langkah berikutnya.",
};

function Fallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent"
        aria-hidden
      />
    </div>
  );
}

export default function FinancialNeedsResultPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <NeedsResultClient />
    </Suspense>
  );
}
