import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import FirmwareClient from "@/components/admin/FirmwareClient";

export const metadata = { title: "펌웨어 관리 — Mystic Lab Admin" };

export default async function FirmwarePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data: releases } = await supabase
    .from("firmware_releases")
    .select("*")
    .order("created_at", { ascending: false });

  return <FirmwareClient initialReleases={releases ?? []} />;
}
