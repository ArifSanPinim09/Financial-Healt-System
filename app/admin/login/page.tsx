import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import LoginClient from "./login-client";

// Halaman login admin (F11, Bab 16.5).
// Route publik — halaman login itu sendiri boleh diakses siapa pun;
// yang terlindungi adalah dashboard & detail (AC9).

export const metadata: Metadata = {
  title: "Masuk · Admin — Livin' Financial Wellness",
  description:
    "Masuk ke dashboard admin untuk mengelola submission assessment nasabah.",
};

export default async function AdminLoginPage() {
  // Sudah login sebagai admin → langsung dashboard, jangan tampilkan form.
  const admin = await requireAdmin();
  if (admin) redirect("/admin/dashboard");

  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
