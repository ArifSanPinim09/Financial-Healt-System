import type { Metadata } from "next";
import QuizFlow from "@/app/quiz/quiz-flow";

export const metadata: Metadata = {
  title: "Financial Health Score · Livin' Financial Wellness",
  description:
    "Ukur kesehatan finansialmu di 6 dimensi — 14 pertanyaan singkat, hasil skor, persona, dan rekomendasi langkah berikutnya.",
};

export default function FinancialHealthQuizPage() {
  return (
    <QuizFlow
      type="RATING"
      title="Financial Health Score"
      resultPath="/financial-health/result"
      questionCount={14}
    />
  );
}
