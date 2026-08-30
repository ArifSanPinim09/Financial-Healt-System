import { Compass, Gauge } from "lucide-react";
import { assessmentLabel, recommendationLabel } from "./format";

// Chip status untuk halaman admin — warna semantik konsisten dengan
// sisi nasabah (Bab 20), selalu dilengkapi teks (Bab 21: bukan warna saja).

export function AssessmentChip({
  type,
  withIcon = false,
}: {
  type: string;
  withIcon?: boolean;
}) {
  const isRating = type === "RATING";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
        isRating ? "bg-accent-tint text-accent-deep" : "bg-improve-tint text-improve",
      ].join(" ")}
    >
      {withIcon &&
        (isRating ? (
          <Gauge className="h-3 w-3" aria-hidden />
        ) : (
          <Compass className="h-3 w-3" aria-hidden />
        ))}
      {assessmentLabel(type)}
    </span>
  );
}

export function RecommendationChip({
  primary,
  secondary,
}: {
  primary: string | null;
  secondary?: string | null;
}) {
  const label = secondary
    ? `${recommendationLabel(primary)} & ${recommendationLabel(secondary)}`
    : recommendationLabel(primary);
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink">
      {label}
    </span>
  );
}
