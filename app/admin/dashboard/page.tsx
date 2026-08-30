import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import DashboardClient from "./dashboard-client";

// Dashboard admin (F10, Bab 16.6, 18).
// AC9 (Bab 26): belum login → redirect ke /admin/login — data submission
// tidak pernah dirender tanpa session admin yang valid.

export const metadata: Metadata = {
  title: "Dashboard · Admin — Livin' Financial Wellness",
  description:
    "Lihat dan kelola submission assessment nasabah untuk follow-up cabang.",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <DashboardClient email={admin.email} />;
}
