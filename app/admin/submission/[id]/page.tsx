import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import DetailClient from "./detail-client";

// Detail submission admin (F10, Bab 16.7) — edit, hapus (soft-delete),
// audit log (Bab 25), toast feedback (Bab 16.7).

export const metadata: Metadata = {
  title: "Detail Submission · Admin — Livin' Financial Wellness",
};

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // AC9: tanpa session admin → login, tidak ada data yang bocor.
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  // Id bukan UUID → pasti tidak ada (tidak perlu query DB).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  return <DetailClient id={id} email={admin.email} />;
}
