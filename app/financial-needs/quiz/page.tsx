import type { Metadata } from "next";
import QuizFlow from "@/app/quiz/quiz-flow";

export const metadata: Metadata = {
  title: "Kebutuhan Kredit · Livin' Financial Wellness",
  description:
    "Temukan produk kredit yang paling relevan untukmu — 10 pertanyaan singkat, hasil KSM, KPR, atau KKB.",
};

export default function FinancialNeedsQuizPage() {
  return (
    <QuizFlow
      type="NEEDS"
      title="Kebutuhan Kredit"
      resultPath="/financial-needs/result"
      questionCount={10}
    />
  );
}
