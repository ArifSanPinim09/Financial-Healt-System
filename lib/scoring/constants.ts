export type DimensionKey =
  | "cash_flow"
  | "debt_management"
  | "emergency_fund"
  | "saving_habit"
  | "investment_habit"
  | "financial_protection";

export type DimensionStatus = "STRONG" | "GOOD" | "IMPROVE" | "PRIORITY";

export type Persona =
  | "THE_ARCHITECT"
  | "THE_BUILDER"
  | "THE_EXPLORER"
  | "THE_ADVENTURER"
  | "THE_STARTER";

export type Readiness = "HIGH" | "MEDIUM" | "LOW";

export interface DimensionWeight {
  key: DimensionKey;
  label: string;
  weight: number;
  questionIds: [string, string];
}

export const DIMENSIONS: DimensionWeight[] = [
  { key: "cash_flow", label: "Cash Flow", weight: 0.25, questionIds: ["Q1_RATING", "Q2_RATING"] },
  { key: "debt_management", label: "Debt Management", weight: 0.2, questionIds: ["Q3_RATING", "Q4_RATING"] },
  { key: "emergency_fund", label: "Emergency Fund", weight: 0.2, questionIds: ["Q5_RATING", "Q6_RATING"] },
  { key: "saving_habit", label: "Saving Habit", weight: 0.15, questionIds: ["Q7_RATING", "Q8_RATING"] },
  { key: "investment_habit", label: "Investment Habit", weight: 0.1, questionIds: ["Q9_RATING", "Q10_RATING"] },
  { key: "financial_protection", label: "Financial Protection", weight: 0.1, questionIds: ["Q11_RATING", "Q12_RATING"] },
];

export const DIMENSION_KEY_TO_LABEL: Record<DimensionKey, string> = {
  cash_flow: "Cash Flow",
  debt_management: "Debt Management",
  emergency_fund: "Emergency Fund",
  saving_habit: "Saving Habit",
  investment_habit: "Investment Habit",
  financial_protection: "Financial Protection",
};

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  rawScore: number;
  contribution: number;
  status: DimensionStatus;
}

export interface RatingScoreResult {
  finalScore: number;
  persona: Persona;
  readiness: Readiness;
  dimensions: DimensionResult[];
}
