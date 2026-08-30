import type { Metadata } from "next";
import { Suspense } from "react";
import ResultClient from "./result-client";

export const metadata: Metadata = {
  title: "Hasil Financial Health Score · Livin' Financial Wellness",
  description:
    "Lihat skor kesehatan finansialmu, persona, status enam dimensi, dan langkah berikutnya yang relevan untukmu.",
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

export default function FinancialHealthResultPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResultClient />
    </Suspense>
  );
}
